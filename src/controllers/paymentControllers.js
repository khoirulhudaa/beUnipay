const historyTransaction = require('../models/historyTransaction');
const User = require('../models/userModel')
const crypto = require('crypto')
const dotenv = require('dotenv');
dotenv.config();

const { Payout: PayoutClient, Invoice: InvoiceClient  } = require('xendit-node');
const xenditPayoutClient = new PayoutClient({ secretKey: 'xnd_development_mkZ1EDWSeFNvcrZ2hkMGTZZuo3TSl9ar88LF8wHCcyffSZwGaqrSwwA70a8UyhS' });
const xenditInvoice = new InvoiceClient({secretKey: 'xnd_development_mkZ1EDWSeFNvcrZ2hkMGTZZuo3TSl9ar88LF8wHCcyffSZwGaqrSwwA70a8UyhS'})

const handlePaymentCallback = async (req, res) => {
    try {
        const callbackData = req.body;
        console.log('callback', callbackData)
        await updateDatabase(callbackData.external_id, callbackData)

        return res.json({ status: 200, data: callbackData });

    } catch (error) {
        return res.json({ status: 500, message: 'Payment failed!', error: error.message })    
    }
}
  
const disbursementPayment = async (req, res) => {
    try {
      const {
        user_id,
        amount,
        channelCode,
        accountNumber,
        fullName,
      } = req.body;

      const referenceId = crypto.randomBytes(20).toString('hex')

      const data = {
        "amount" : amount,
        "channelProperties" : {
          "accountNumber" : String(accountNumber),
          "accountHolderName" : fullName
        },
        "description" : "Withdraw (balance)",
        "currency" : "IDR",
        "type" : "DIRECT_DISBURSEMENT",
        "referenceId" : referenceId,
        "channelCode" : channelCode
      }
      
      const response = await xenditPayoutClient.createPayout({
          idempotencyKey: referenceId,
          data
      })
        
      if(response) {
        const filter = { user_id }
        const existingData = await User.findOne(filter);
        
        if (existingData) {
          const set = { balance: existingData.balance - amount };
          await User.updateOne(filter, set)
          return res.json({status: 200, message: 'Withdraw successfully!!' , data: response});
        }
      }
      
    } catch (error) {
      return res.json({ status: 500, error: 'Server Error', message: error.message });
    }
};

const createPayment = async (req, res) => {
  try {

    const {
      amount,
      fullName,
      number_telephone,
      email,
      description,
      typePayment,
      NIM,
      to,
    } = req.body;
    
    const referenceId = crypto.randomBytes(5).toString('hex')
    
    const data = {
      "amount" : amount,
      "invoiceDuration" : 172800,
      "externalId" : NIM,
      "description" : description,
      "currency" : "IDR",
      "reminderTime" : 1,
      "successRedirectUrl": "https://unipay-ikmi.vercel.app/successPayment",
    }

    // console.log('data transaksi:', data)

    const response = await xenditInvoice.createInvoice({
        data
    })

    if(response) {
      const dataHistory = {
          history_id: referenceId,
          email,
          status: 'PENDING',
          description,
          fullName,
          amount,
          number_telephone,
          NIM,
          recipient: to,
          type_payment: typePayment
      }

      const historyTransactionSave = new historyTransaction(dataHistory)

      await historyTransactionSave.save()
      
      return res.json({ status: 200, message: 'Your payment is still pending!', data: response})

    } else {
      return res.json({ status: 500, message: 'Failed create payment!!', data: response})
    }
    
  } catch (error) {
    return res.json({ status: 500, message: 'Server error!', error: error.message})
  }
}
  
const updateDatabase = async (external_id, data) => {
  try {

      let DESCRIPTION 
      let NIM_TO

      if(data.description.include('_')) {
        const parts = DESCRIPTION.split("_");
        DESCRIPTION = parts[0]; 
        NIM_TO = parts[1]
      }else {
        DESCRIPTION = data.description
        NIM_TO = ''
      }

      if(DESCRIPTION === 'TOP-UP') {
          
        const filterBalance = { NIM: external_id };
          const dataBalance = await User.findOne(filterBalance)
          if(!dataBalance) {
            return { status: 404, message: 'User not found!' };
          }
    
          const addBalanceWithTopUp = {
            balance: dataBalance.balance + data.amount,
          };
    
          if(data.status === 'PAID') {
            await User.updateOne(filterBalance, addBalanceWithTopUp);
            await historyTransaction.updateOne(filterBalance, { status: 'PAID' })
            return { status: 200, message: 'Success update status payment!' }
          }else {
            return { status: 200, message: `Status payment is ${data.status}!` }
          }
      } else if(DESCRIPTION === 'TRANSFER') {

        const filterBalanceFROM = { NIM: external_id }
        const filterBalanceTO = { NIM: NIM_TO }

        const dataBalanceFROM = await User.findOne(filterBalanceFROM)
        const dataBalanceTO = await User.findOne(filterBalanceTO)
       
        if(!dataBalanceFROM || !dataBalanceTO) {
          return { status: 404, message: 'User not found!' };
        }
  
        const addBalanceWithTopUp = {
          balance: dataBalanceTO.balance + data.amount,
        };
  
        const minusBalanceWithTransaction = {
          balance: dataBalanceFROM.balance - data.amount,
        };
  
        if(data.status === 'PAID') {
          await User.updateOne(filterBalanceFROM, minusBalanceWithTransaction);
          await User.updateOne(filterBalanceTO, addBalanceWithTopUp);
         
          await historyTransaction.updateOne(filterBalanceFROM, { status: 'PAID' })
          return { status: 200, message: 'Success update status payment!' }
        }else {
          return  res.json({ status: 500, message: `Status payment is failed for ${data.status}!` })
        }
      } else {
        
        const filterBalance = { NIM: external_id }
        const dataBalance = await User.findOne(filterBalance)

        const minusBalanceWithTransaction = {
          balance: dataBalance.balance - data.amount,
        };
        
        if(data.status === 'PAID') {
          await User.updateOne(filterBalance, minusBalanceWithTransaction)
          await historyTransaction.updateOne(filterBalance, { status: 'PAID' })
          return { status: 200, message: 'Success update status payment!' }
        }else {
          return  res.json({ status: 500, message: `Status payment is failed for ${data.status}!` })
        }
      }

  } catch (error) {
      return { status: 500, message: 'Error server!', error: error.message }
    }
};
  
const getAllPaymentByShop = async (req, res) => {
  try {
      const { user_id } = req.params
      
      const getPayment = await paymentMethodModel.findOne({ user_id })
      
      if(getPayment === 0) return res.json({ status: 404, message: 'Data payment not found!' })

      return res.json({ status: 200, message: 'All data payment method', data: getPayment })

  } catch (error) {
      return res.json({ status: 500, message: 'Error server!', error: error.message });
  }
}

const updatePaymentMethod = async (req, res) => {
  try {
    const { user_id } = req.params
    const updates = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ status: 400, message: 'Invalid parameter! Expecting an array in the request body.', data: updates });
    }

    const updatePromises = updates.map(async (update) => {
        const { bank_code, account_number, isEnabled } = update;
        const result = await paymentMethodModel.updateOne(
            { user_id: user_id, 'payments.bank_code': bank_code },
            { $set: { 
              'payments.$.account_number': account_number ,
              'payments.$.isEnabled': isEnabled ,
            } },
            { new: true }
        );
    
        return result;
    });
  
    const results = await Promise.all(updatePromises);    
      
    if (! results) {
        return res.json({ status: 404, message: 'No payment methods were updated.', data: updates });
    }

    return res.json({ status: 200, message: 'Successfully updated payment methods!', data: updates });

  } catch (error) {
    return res.json({ status: 500, message: 'Error server!', error: error.message });
  }
}

module.exports = {
    handlePaymentCallback,
    createPayment,
    disbursementPayment,
    getAllPaymentByShop,
    updatePaymentMethod
}
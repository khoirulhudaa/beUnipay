const historyTransaction = require('../models/historyTransaction');
const canteenModel = require('../models/canteenModel');
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
        await updateDatabase(callbackData.external_id, callbackData)

        return res.json({ status: 200, data: callbackData });

    } catch (error) {
        return res.json({ status: 500, message: 'Payment failed!', error: error.message })    
    }
}

// Withdraw
  
const disbursementPayment = async (req, res) => {
    try {
      const {
        amount,
        fullName,
        number_telephone,
        email,
        description,
        typePayment,
        NIM,
        classRoom,
        note,
        channelCode,
        accountNumber,
        accountHolderName,
      } = req.body;

      const referenceId = crypto.randomBytes(20).toString('hex')

      const data = {
        "amount" : amount,
        "channelProperties" : {
          "accountNumber" : String(accountNumber),
          "accountHolderName" : accountHolderName
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
        const filter = { NIM }
        const existingData = await User.findOne(filter);
        
        if (existingData) {
            const set = { balance: existingData.balance - amount };
            await User.updateOne(filter, set)

            const dataHistory = {
              history_id: NIM+"OF_ID"+referenceId,
              email,
              description,
              fullName,
              note,
              status: 'WITHDRAW',
              amount,
              number_telephone,
              NIM,
              type_payment: typePayment,
              classRoom,
              recipient: NIM
          }
    
          const historyTransactionSave = new historyTransaction(dataHistory)
    
          await historyTransactionSave.save()
          return res.json({status: 200, message: 'Withdraw successfully!', data: response});
        }
          return res.json({ status: 404, message: 'User not found!' });
      }
      
    } catch (error) {
      return res.json({ status: 500, error: 'Server Error', message: error.message });
    }
};

// Top-up

const createPayment = async (req, res) => {
  try {

    const {
      amount,
      fullName,
      number_telephone,
      email,
      description,
      typePayment,
      year,
      NIM,
      to,
      classRoom,
      note
    } = req.body;

    const requiredFields = ['amount', 'classRoom'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
        return res.json({ status: 401, message: 'Fields are missing'});
    }
    
    const referenceId = crypto.randomBytes(5).toString('hex')
    
    const data = {
      "amount" : amount,
      "invoiceDuration" : 172800,
      "externalId" : NIM+"OF_ID"+referenceId,
      "description" : description,
      "currency" : "IDR",
      "reminderTime" : 1,
      "successRedirectUrl": "https://unipay-ikmi.vercel.app/successPayment",
    }

    const response = await xenditInvoice.createInvoice({
        data
    })

    if(response) {
      const dataHistory = {
          history_id: NIM+"OF_ID"+referenceId,
          email,
          status: 'PENDING',
          description,
          fullName,
          note,
          amount,
          number_telephone,
          year,
          NIM,
          recipient: to,
          type_payment: typePayment,
          classRoom
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

// Transfer

const createTransfer = async (req, res) => {
  try {

    const {
      amount,
      fullName,
      number_telephone,
      email,
      description,
      typePayment,
      year,
      NIM,
      to,
      classRoom,
      note
    } = req.body;

    const requiredFields = ['amount', 'classRoom', 'NIM', 'typePayment'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
        return res.json({ status: 401, message: 'Fields are missing'});
    }
    
    const referenceId = crypto.randomBytes(5).toString('hex')
    
    const dataHistory = {
        history_id: NIM+"OF_ID"+referenceId,
        email,
        status: 'Transaction (Unipay)',
        description,
        fullName,
        note,
        amount,
        number_telephone,
        year,
        NIM,
        recipient: to,
        type_payment: typePayment,
        classRoom
    }

    const filterBalance = { NIM };

    const dataBalance = await User.findOne(filterBalance)
    if(!dataBalance) {
      return { status: 404, message: 'User not found!' };
    }

    const addBalanceWithTopUp = {
      balance: dataBalance.balance + amount
    };

    if(description === 'Kantin') {
      canteenModel.updateOne({}, { $inc: { revenueCanteen: amount } })
    }

    await User.updateOne(filterBalance, addBalanceWithTopUp);
    const historyTransactionSave = new historyTransaction(dataHistory)
    const response = await historyTransactionSave.save()

    if(response) {
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
      await historyTransaction.updateOne({history_id: external_id}, { status: 'PAID' })

      return res.json({ status: 200, message: 'Success update status payment!', data: response})
    }else {
      return res.json({ status: 200, message: `Status payment is ${data.status}!` })
    }
          
  } catch (error) {
      return { status: 500, message: 'Error server!', error: error.message }
    }
};
  
const getAllPaymentMethods = async (req, res) => {
  try {
      const getPayment = await paymentMethodModel.find()
      
      if(getPayment === 0) return res.json({ status: 404, message: 'Data payment not found!' })

      return res.json({ status: 200, message: 'All data payment methods', data: getPayment })

  } catch (error) {
      return res.json({ status: 500, message: 'Error server!', error: error.message });
  }
}

const getAllHistoryPayments = async (req, res) => {
  try {
    const { NIM, typePayment, classRoom, year, prodi } = req.body  
    
    const filter = {}
    if(NIM) filter.NIM = NIM
    if(typePayment) filter.typePayment = typePayment
    if(classRoom) filter.classRoom = classRoom
    if(year) filter.year = year
    if(prodi) filter.prodi = prodi

    const historyData = await historyTransaction.find(filter)
    if(historyData === 0) return res.json({ status: 404, message: 'History not found!' }) 

    return res.json({ status: 200, message: 'Successfully get history payments!', data: historyData }) 

  } catch (error) {
    return res.json({ status: 500, message: 'Error server!', error: error.message });
  }
}

module.exports = {
    handlePaymentCallback,
    createPayment,
    disbursementPayment,
    getAllPaymentMethods,
    getAllHistoryPayments,
    createTransfer
}
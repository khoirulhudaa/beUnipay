const historyConsumeModel = require('../models/historyInConsumerModel');
const historySellerModel = require('../models/historyInSellerModel');
const paymentMethodModel = require('../models/methodePayment');
const revenueModel = require('../models/requestModel')
const crypto = require('crypto')
const dotenv = require('dotenv');
dotenv.config();

const { Payout: PayoutClient, Invoice: InvoiceClient  } = require('xendit-node');
const xenditPayoutClient = new PayoutClient({ secretKey: 'xnd_development_LHt55GITF5Fri0xE3vF5Akd28vtDkpLNs2Y1Xcz4gOLOCPJe4hmTmujzagqY4O7' });
const xenditInvoice = new InvoiceClient({secretKey: 'xnd_development_LHt55GITF5Fri0xE3vF5Akd28vtDkpLNs2Y1Xcz4gOLOCPJe4hmTmujzagqY4O7'})


const handlePaymentCallback = async (req, res) => {
    try {
        const callbackData = req.body;

        await updateDatabase(callbackData.external_id, callbackData)

        return res.json({ status: 200, data: callbackData });

    } catch (error) {
        return res.json({ status: 500, message: 'Payment failed!', error: error.message })    
    }
}
  
const disbursementPayment = async (req, res) => {
    try {
      const {
        revenue_id,
        amount,
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
        "description" : "Withdraw",
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
        const filter = { revenue_id }
        const existingData = await revenueModel.findOne(filter);
        
        if (existingData) {
          const set = { balance: existingData.balance - (amount - 3000) };
          await revenueModel.updateOne(filter, set)
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
      products, 
      accountHolderName,
      telephone_consumer,
      consumer_id,
      email_consumer,
      post_code,
      description,
      address,
      shop_id
    } = req.body;

    const referenceId = crypto.randomBytes(5).toString('hex')
    
    const data = {
      "amount" : amount,
      "invoiceDuration" : 172800,
      "externalId" : referenceId+'__'+shop_id,
      "description" : description,
      "currency" : "IDR",
      "reminderTime" : 1,
      "successRedirectUrl": "https://elect-shop.vercel.app/successPayment",
    }

    const response = await xenditInvoice.createInvoice({
        data
    })

    if(response) {
      const dataHistory = {
          history_id: referenceId,
          products,
          post_code,
          email_consumer,
          status: 'PENDING',
          address,
          description,
          shop_id,
          consumer_name: accountHolderName,
          telephone_consumer,
          consumer_id
      }

      const consumerHistory = new historyConsumeModel(dataHistory)
      const sellerHistory = new historySellerModel(dataHistory)

      await consumerHistory.save()
      await sellerHistory.save()
      
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
    
      const filterCharacter = external_id.split('__')
      const resultFilterCharacters = filterCharacter[1]
      const resultFilterCharacters2 = filterCharacter[0]
      
      const filter = { history_id: resultFilterCharacters2 };
      const filterRevenue = { revenue_id: resultFilterCharacters };

      console.log('history_id', external_id)
      console.log('revenue_id', resultFilterCharacters)
      console.log('status', data.status)

      const dataRevenue = await revenueModel.findOne(filterRevenue)
      if(!dataRevenue) {
        return { status: 404, message: 'Revenue not found!' };
      }

      const updateDataRevenue = {
        revenue: dataRevenue.revenue + data.amount,
        balance: dataRevenue.balance + data.amount,
      };

      
      if(data.status === 'PAID') {
        await revenueModel.updateOne(filterRevenue, updateDataRevenue);
        await historyConsumeModel.updateOne(filter, { status: 'PAID' })
        await historySellerModel.updateOne(filter, { status: 'PAID' })
        return { status: 200, message: 'Success update status payment!' }
      }else {
        console.log('NOT PAID!')
        return { status: 200, message: `Status payment is ${data.status}!` }
      }

  } catch (error) {
      return { status: 500, message: 'Error server!', error: error.message }
    }
};
  
const getAllPaymentByShop = async (req, res) => {
  try {
      const { shop_id } = req.params
      
      const getPayment = await paymentMethodModel.findOne({ shop_id })
      
      if(getPayment === 0) return res.json({ status: 404, message: 'Data payment not found!' })

      return res.json({ status: 200, message: 'All data payment method', data: getPayment })

  } catch (error) {
      return res.json({ status: 500, message: 'Error server!', error: error.message });
  }
}

const updatePaymentMethod = async (req, res) => {
  try {
    const { shop_id } = req.params
    const updates = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ status: 400, message: 'Invalid parameter! Expecting an array in the request body.', data: updates });
    }

    const updatePromises = updates.map(async (update) => {
        const { bank_code, account_number, isEnabled } = update;
        const result = await paymentMethodModel.updateOne(
            { shop_id: shop_id, 'payments.bank_code': bank_code },
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
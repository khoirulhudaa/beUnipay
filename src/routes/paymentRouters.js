const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentControllers')

// To-pup
router.post('/top-up', paymentController.createPayment)

// Withdraw
router.post('/withdraw', paymentController.disbursementPayment)

// Callback
router.post('/callback', paymentController.handlePaymentCallback)

// Transfer
router.post('/create', paymentController.createTransfer)

// History
router.get('/history', paymentController.getAllHistoryPayments)


module.exports = router
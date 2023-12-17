const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentControllers')

// Data history payments
router.get('/methods', paymentController.getAllPaymentByShop)

// Update-payment
router.put('/update/methods', paymentController.getAllPaymentByShop)

// To-pup
router.post('/top-up', paymentController.createPayment)

// Withdraw
router.post('/withdraw', paymentController.disbursementPayment)

// Callback
router.post('/callback', paymentController.handlePaymentCallback)

// Transfer
router.post('/create', paymentController.createPayment)

router.get('/history', paymentController.getAllHistoryPayments)


module.exports = router
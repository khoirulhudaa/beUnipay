const express = require('express')
const accountController = require('../controllers/accountControllers')
const router = express.Router()

// Sign consumer and seller
router.post('/signup/seller', accountController.signUpSeller)
router.post('/signin/seller', accountController.signInSeller)

router.post('/signup/consumer', accountController.signUpConsumer)
router.post('/signin/consumer', accountController.signInConsumer)

// Get list users
router.get('/list/consumer/:consumer_id', accountController.getAllConsumer)
router.get('/list/seller/:seller_id?', accountController.getAllSeller)

// Delete Account
router.delete('/consumer/:consumer_id', accountController.removeConsumer)
router.delete('/seller/:seller_id', accountController.removeSeller)

// Update Account
router.put('/consumer/:consumer_id', accountController.upload.single('consumer_image'), accountController.updateConsumerAccount)
router.put('/seller/:seller_id', accountController.upload.single('seller_image'), accountController.updateSellerAccount)

// Reset password
router.post('/seller/forgot-password', accountController.forgotPassword)
router.put('/seller/reset-password/:token', accountController.resetPassword)

module.exports = router
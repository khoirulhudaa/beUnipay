const express = require('express')
const accountController = require('../controllers/accountControllers')
const router = express.Router()

// Sign consumer and seller
router.post('/signup', accountController.signUpSeller)
router.post('/signin', accountController.signInSeller)

// Get list users
router.get('/list/user/:user_id', accountController.getAllConsumer)

// Delete Account
router.delete('/user/:user_id', accountController.removeSeller)

// Update Account
router.put('/user/:user_id', accountController.upload.single('seller_image'), accountController.updateSellerAccount)

// Reset password
router.post('/user/forgot-password', accountController.forgotPassword)
router.put('/user/reset-password/:token', accountController.resetPassword)

module.exports = router
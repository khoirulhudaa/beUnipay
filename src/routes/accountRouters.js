const express = require('express')
const accountController = require('../controllers/accountControllers')
const router = express.Router()

// Sign consumer and seller
router.post('/signup', accountController.signUp)
router.post('/signin', accountController.signIn)

// Get list users
router.get('/list/:user_id', accountController.getAccountById)

// Delete Account
router.delete('/:user_id', accountController.removeUser)

// Update Account
router.put('/:user_id', accountController.upload.single('seller_image'), accountController.updateUserAccount)

// Reset password
router.post('/forgot-password', accountController.forgotPassword)
router.put('/reset-password/:token', accountController.resetPassword)

module.exports = router
const express = require('express')
const accountController = require('../controllers/accountControllers')
const router = express.Router()
const checkToken = require('../middlewares/verifyToken')

// Sign consumer and seller
router.post('/signup', accountController.signUp)
router.post('/signin', accountController.signIn)

// Get list users
router.get('/:user_id?', checkToken, accountController.getAccountById)

// Delete Account
router.delete('/:user_id', checkToken, accountController.removeUser)

// Update Account
router.put('/:user_id', checkToken, accountController.updateUserAccount)

// Reset password
router.post('/forgot-password', accountController.forgotPassword)
router.put('/reset-password/:token', accountController.resetPassword)

module.exports = router
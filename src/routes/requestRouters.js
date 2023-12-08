const express = require('express')
const requestController = require('../controllers/requestControllers')
const router = express.Router()

router.post('/', requestController.createRequest)

module.exports = router
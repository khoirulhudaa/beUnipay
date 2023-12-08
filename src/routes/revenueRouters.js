const express = require('express')
const router = express.Router()
const revenueController = require('../controllers/revenueControllers')

router.get('/:revenue_id', revenueController.getRevenueById)

module.exports = router
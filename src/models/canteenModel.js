const mongoose = require('mongoose')

const CanteenSchema = new mongoose.Schema({
    revenueCanteen: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('canteen', CanteenSchema)
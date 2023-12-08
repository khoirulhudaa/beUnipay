const mongoose = require('mongoose')

const revenueSchema = new mongoose.Schema({
    revenue_id: {
        type: String,
        required: true
    },
    revenue: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model('revenue', revenueSchema)
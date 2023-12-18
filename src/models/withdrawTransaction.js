const mongoose = require('mongoose')

const HistorySchema = new mongoose.Schema({
    history_id: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    NIM: {
        type: String,
        required: true
    },
    classRoom: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    type_payment: {
        type: String,
        required: true
    },  
    date: {
        type: Date,
        default: new Date()
    },
    description: {
        type: String,
        required: true
    },
    note: {
        type: String,
        default: '-'
    },
    number_telephone: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('withdraw', HistorySchema)
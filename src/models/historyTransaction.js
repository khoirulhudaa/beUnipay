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
    NIM: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    recipient: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: new Date()
    },
    status: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    number_telephone: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('HistoryConsumer', HistorySchema)
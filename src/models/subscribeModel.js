const mongoose = require('mongoose')

const subscribeSchema = new mongoose.Schema({
    subscribe_id: {
        type: String,
        required: true
    },
    email_consumer: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('subsribe', subscribeSchema)
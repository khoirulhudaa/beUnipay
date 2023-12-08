const mongoose = require('mongoose')

const ConsumerSchema = new mongoose.Schema({
    consumer_name: {
        type: String,
        required: true
    },
    email_consumer: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(value) {
                // Use a regular expression to validate the email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value);
            },
            message: 'Invalid email format',
        }
    },
    password: {
        type: String,
        required: true
    },
    consumer_id: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true,
        default: 'Male'
    },
    telephone_consumer: {
        type: String,
        required: true,
    },
    post_code: {
        type: Number,
        default: 0,
    },
    address: {
        type: String,
        default: '-'
    },
    consumer_image: {
        type: String,
        default: 'default.png'
    }
})

module.exports = mongoose.model('consumer', ConsumerSchema)
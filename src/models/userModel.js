const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
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
    user_id: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true,
        default: 'Male'
    },
    number_telephone: {
        type: String,
        required: true,
    },
    NIK: {
        type: String,
        default: 0,
    },
    NIM: {
        type: String,
        default: '-'
    },
    prodi: {
        type: String,
        default: 'default.png'
    },
    type_image: {
        type: String,
        default: 'Man1'
    },
    resetTokenPassword: {
        type: String,
        default: ''
    }
})

module.exports = mongoose.model('user', UserSchema)
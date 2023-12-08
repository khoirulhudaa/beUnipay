const mongoose = require('mongoose')

const ShopSchema = new mongoose.Schema({
    shop_id: {
        type: String,
        required: true
    },
    seller_id: {
        type: String,
        required: true,
    },
    seller_name: {
        type: String,
        required: true
    },
    shop_name: {
        type: String,   
        required: true
    },
    email_seller: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(value) {
                // Use a regular expression to validate the email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value);
            },
            message: 'Invalid email format'
        }
    },
    shop_address: {
        type: String,
        default: ''
    },
    image_shop: {
        type: String,
        default: 'defaultShop.jpg'
    },
    motto_shop: {
        type: String,
        default: ''
    },
    description_shop: {
        type: String,
    },
    telephone_seller: {
        type: String,
        required: true
    },
    followers: {
        type: Number,
        default: 0
    },
})

module.exports = mongoose.model('shop', ShopSchema)
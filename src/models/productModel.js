const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    product_name: {
        type: String,
        required: true
    },
    product_id: {
        type: String,
        required: true
    },
    shop_id: {
        type: String,
        required: true
    },
    product_type: {
        type: String,
        required: true,
        default: 'New product'
    },
    product_color: {
        type: String,
        required: true,
        default: 'black'
    },
    product_description: {
        type: String,
        required: true
    },
    product_category: {
        type: String,
        required: true
    },
    product_image: {
        type: String,
        required: true,
        default: 'default.jpg'
    },
    product_price: {
        type: Number,
        required: true,
        default: 0
    },
    product_size: {
        type: String,
        required: true,
        default: 'Normal'
    },
    product_brand: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    shop_name: {
        type: String,
        required: true
    },
    image_shop: {
        type: String,
        default: 'default.png'
    }
})

module.exports = mongoose.model('product', productSchema)
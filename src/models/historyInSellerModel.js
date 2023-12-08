const mongoose = require('mongoose')

const HistorySchema = new mongoose.Schema({
    history_id: {
        type: String,
        required: true
    },
    consumer_name: {
        type: String,
        required: true
    },
    consumer_id: {
        type: String,
        required: true
    },
    email_consumer: {
        type: String,
        required: true
    },
    post_code: {
        type: String,
        require: true
    },
    address: {
        type: String,
        require: true
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
    shop_id: {
        type: String,
        required: true
    },
    products: [
        {
            idCart: {
                type: String,
                required: true
            },
            image_shop: {
                type: String,
                required: true
            },
            product_brand: {
                type: String,
                required: true
            },
            product_category: {
                type: String,
                required: true
            },
            product_color: {
                type: String,
                required: true
            },
            product_description: {
                type: String,
                required: true
            },
            product_id: {
                type: String,
                required: true
            },
            product_image: {
                type: String,
                required: true
            },
            product_name: {
                type: String,
                required: true
            },
            product_price: {
                type: Number,
                required: true
            },
            product_size: {
                type: String,
                required: true
            },
            product_type: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            quantityInCart: {
                type: Number,
                required: true
            },
            shop_id: {
                type: String,
                required: true
            },
            shop_name: {
                type: String,
                required: true
            },
            total_price: {
                type: Number,
                required: true
            },
            __v: {
                type: Number,
                required: true
            },
            _id: {
                type: String,
                required: true
            }
        }
    ],
})

module.exports = mongoose.model('historySeller', HistorySchema)
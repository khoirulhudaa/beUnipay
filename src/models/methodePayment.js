const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
    shop_id: {
        type: String,
        required: true
    },
    payments: [
    {
        bank_code: {
            type: String,
            required: true
        },
        account_number: {
            type: Number,
            required: true,
            default: 0
        },
        isEnabled: {
            type: Boolean,
            default: false
        }
    }
  ]
});

module.exports = mongoose.model('paymentMethod', paymentMethodSchema);

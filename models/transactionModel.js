const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TransactionSchema = new Schema({
    itemBought: {
        type: String
    },
    itemQuantity: {
        type: Number
    },
    transactionId: {
        type: String
    },
    username: {
        type: String
    },
    number: {
        type: String
    },
    image: {
        type: String
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    isApp: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

const Transaction = mongoose.model('transaction', TransactionSchema)
module.exports = Transaction
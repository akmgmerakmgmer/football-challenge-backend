const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ShopItemSchema = new Schema({
    itemType: {
        type: String,
        required: [true, 'field_required']
    },
    backgroundImage: {
        type: String,
    },
    image: {
        type: String,
    },
    title: {
        en: {
            type: String,
            required: [true, 'field_required']
        },
        ar: {
            type: String,
            required: [true, 'field_required']
        }
    },
    description: {
        en: {
            type: String,
        },
        ar: {
            type: String,
        }
    },
    numberOfCoins: {
        type: Number
    },
    price: {
        type: Number
    },
    avatars: {
        type: [Schema.Types.ObjectId],
        ref: 'avatar'
    },
    perks: {
        type: [
            {
                id: {
                    type: Schema.Types.ObjectId,
                    ref: 'perk'
                },
                quantity: {
                    type: Number
                }
            }
        ],
        default: []
    }
})

const ShopItem = mongoose.model('shopItem', ShopItemSchema)
module.exports = ShopItem
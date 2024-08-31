const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PerkSchema = new Schema({
    backgroundImage: {
        type: String,
        required: [true, 'field_required']
    },
    image: {
        type: String,
        required: [true, 'field_required']
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
    price: {
        type: Number
    }
})

const Perk = mongoose.model('perk', PerkSchema)
module.exports = Perk
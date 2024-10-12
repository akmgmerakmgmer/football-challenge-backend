const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AvatarModel = new Schema({
    image: {
        type: String,
        required: [true, 'field_required']
    },
    price: {
        type: Number,
        required: [true, 'field_required']
    },
    purchases: {
        type: Number,
        default: 0
    }
})


const Avatar = mongoose.model('avatar', AvatarModel)
module.exports = Avatar
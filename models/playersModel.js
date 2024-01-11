const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PlayerSchema = new Schema({
    firstName: {
        type: String,
    },
    nameEn: {
        type: String,
        required: [true, 'field_required']
    },
    nameAr: {
        type: String,
        required: [true, 'field_required']
    },
    image: {
        type: String,
    },
    playerId: {
        type: Number
    },
})

const Player = mongoose.model('player', PlayerSchema)
module.exports = Player
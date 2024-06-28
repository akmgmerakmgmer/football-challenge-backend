const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ChallengeModel = new Schema({
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
        required: [true, 'field_required']
    },
    type:{
        type: String,
        required: [true, 'field_required']
    }
})


const Challenge = mongoose.model('challenge', ChallengeModel)
module.exports = Challenge
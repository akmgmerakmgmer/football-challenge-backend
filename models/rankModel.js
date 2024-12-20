const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RankModel = new Schema({
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
    next_rank: {
        type: Schema.Types.ObjectId,
        ref: 'rank'
    },
    prev_rank: {
        type: Schema.Types.ObjectId,
        ref: 'rank'
    },
    wins_to_promote: {
        type: Number,
    },
    loses_to_demote: {
        type: Number,
    },
    numberOfPlayers: {
        type: Number,
        default: 0
    }
})


const Rank = mongoose.model('rank', RankModel)
module.exports = Rank
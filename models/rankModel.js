const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RankModel = new Schema({
    bgImage: {
        type: String,
        required: [true, 'field_required']
    },
    image: {
        type: String,
        required: [true, 'field_required']
    },
    rank_banner: {
        en: {
            type: String,
            required: [true, 'field_required']
        },
        ar: {
            type: String,
            required: [true, 'field_required']
        }
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
    season_end_rank: {
        type: Schema.Types.ObjectId,
        ref: 'rank',
        default: '678c04a88c4271003486ca44'
    },
    wins_to_promote: {
        type: Number,
        default: ''
    },
    loses_to_demote: {
        type: Number,
        default: ''
    },
    numberOfPlayers: {
        type: Number,
        default: 0
    },
    prizes: {
        type: [Object],
        default: []
    },
    rank_number: {
        type: Number,
    },
}, {
    timestamps: true
})


const Rank = mongoose.model('rank', RankModel)
module.exports = Rank
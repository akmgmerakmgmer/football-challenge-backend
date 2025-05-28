const mongoose = require('mongoose')
const Schema = mongoose.Schema

const EventSchema = new Schema({
    eventName: {
        en: {
            type: String,
            required: [true, 'field_required']
        },
        ar: {
            type: String,
            required: [true, 'field_required']
        },
    },
    description: {
        en: {
            type: String,
            default: ''
        },
        ar: {
            type: String,
            default: ''
        },
    },
    image: {
        type: String,
        required: [true, 'field_required']
    },
    total_points: {
        type: Number,
        default: 0
    },
    games_played: {
        type: Number,
        default: 0
    },
    number_of_players: {
        type: Number,
        default: 0
    },
    sides: {
        type: [
            {
                nameEn: {
                    type: String,
                    required: [
                        function () {
                            const parent = this.parent();
                            return !(parent.isMultiplayer || parent.isSinglePlayer);
                        },
                        'field_required'
                    ]
                },
                nameAr: {
                    type: String,
                    required: [
                        function () {
                            const parent = this.parent();
                            return !(parent.isMultiplayer || parent.isSinglePlayer);
                        },
                        'field_required'
                    ]
                },
                points: {
                    type: Number,
                    default: 0
                },
                numberOfPlayers: {
                    type: Number,
                    default: 0
                }
            }
        ],
        default: []
    },
    price: {
        type: Number,
    },
    prizes: {
        type: [Object],
        default: []
    },
    endDate: {
        type: String
    },
    isSinglePlayer: {
        type: Boolean,
        default: false
    },
    isMultiplayer: {
        type: Boolean,
        default: false
    },
    rankings: {
        type: [{
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'user',
            },
            points: {
                type: Number,
                default: 0
            }
        }],
        default: []
    },
    active: {
        type: Boolean,
        default: true
    }
})

const Event = mongoose.model('event', EventSchema)
module.exports = Event
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RoomModel = new Schema({
    numberOfPlayers: {
        type: Number,
        default: 2
    },
    players: {
        type: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: 'user', // Reference to the 'user' model
                },
                points: {
                    type: Number,
                    default: 0
                },
                timeDone: {
                    type: Boolean,
                    default: false
                },
                isLeft: {
                    type: Boolean,
                    default: false
                }
            }
        ],
        default: [],
        validate: [
            function (players) {
                // 'this' refers to the Room document
                return players.length <= this.numberOfPlayers;
            },
            'Players array cannot exceed the numberOfPlayers'
        ]
    },
    gameDuration: {
        type: Number,
        default: 90
    },
    isJoinable: {
        type: Boolean,
        default: true
    },
    isCasual: {
        type: Boolean,
        default: false
    },
    code: {
        type: String,
        default: ''
    },
    questionMode: {
        type: String,
        default: ''
    },
    questions: {
        type: [],
        default: []
    }
}, {
    timestamps: true
});


const Room = mongoose.model('room', RoomModel)
module.exports = Room
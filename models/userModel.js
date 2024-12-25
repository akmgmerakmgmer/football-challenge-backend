const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')

const UserSchema = new Schema({
    username: {
        type: String,
        required: [true, 'field_required'],
        unique: true,
        minlength: [4, 'username_min_length'],
    },
    password: {
        type: String,
        minlength: [6, 'password_min_length'],
        required: [true, 'field_required'],
    },
    email: {
        type: String,
    },
    number: {
        type: String,
        minlength: [11, 'number_min_length'],
        maxlength: [11, 'number_min_length'],
        required: [true, 'field_required'],
    },
    points: {
        type: Number,
        default: 0
    },
    user_points: {
        totalPoints: {
            type: Number
        },
        dailyPoints: {
            day: {
                type: String
            },
            points: {
                type: Number
            },
            games_played: {
                type: Number,
                default: 0
            }
        },
        yearlyPoints: [
            {
                points: {
                    type: Number,
                    default: 0
                },
                year: {
                    type: Number
                },
                games_played: {
                    type: Number,
                    default: 0
                }
            }
        ],
        monthlyPoints: [
            {
                points: {
                    type: Number,
                    default: 0
                },
                month: {
                    type: Number
                },
                year: {
                    type: Number
                },
                games_played: {
                    type: Number,
                    default: 0
                }
            }
        ],
        weeklyPoints: [
            {
                points: {
                    type: Number,
                    default: 0
                },
                weekDate: {
                    type: String
                },
                games_played: {
                    type: Number,
                    default: 0
                }
            }
        ]
    },
    coins: {
        type: Number,
        default: 1000
    },
    games_played: {
        type: Number,
        default: 0
    },
    challenges: {
        type: [
            {
                id: {
                    type: Schema.Types.ObjectId,
                    ref: 'challenge'
                },
                lastPlayedDate: {
                    type: String
                },
                index: {
                    type: Number
                }
            },
        ],
        default: []
    },

    questionModes: {
        type: [
            {
                modeName: {
                    type: String
                },
                lastPlayedDate: {
                    type: String
                },
                index: {
                    type: Number
                }
            },
        ],
        default: []
    },
    avatars: {
        type: [Object],
        default: [{
            image: 'http://res.cloudinary.com/do0qe5hin/image/upload/v1711999092/y1ubiaq6qm7xsya07qg8.jpg',
            price: 0
        }]
    },
    selectedAvatar: {
        type: Object,
        default: {
            image: 'http://res.cloudinary.com/do0qe5hin/image/upload/v1711999092/y1ubiaq6qm7xsya07qg8.jpg',
            price: 0
        }
    },
    themes: {
        type: [String],
        default: ['http://res.cloudinary.com/do0qe5hin/image/upload/v1732278095/smkjxdd13hkajcdjtnpb.jpg']
    },
    selectedTheme: {
        type: String,
        default: 'http://res.cloudinary.com/do0qe5hin/image/upload/v1732278095/smkjxdd13hkajcdjtnpb.jpg'
    },
    roles: {
        type: [String],
        default: ['client']
    },
    disabled: {
        type: Boolean,
        default: false
    },
    notifyAbout: {
        type: [String]
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
                },
                selected: {
                    type: Boolean
                }
            }
        ],
        default: [
            {
                id: '66c9ee28fc6e3ce9479dc9c6',
                quantity: 3,
                selected: true,
            },
            {
                id: '66c9ee72fc6e3ce9479dc9cc',
                quantity: 3,
                selected: true,
            },
            {
                id: '66c9eea4fc6e3ce9479dc9d2',
                quantity: 3,
                selected: true,
            },
            {
                id: '66c9eef9fc6e3ce9479dc9e0',
                quantity: 3,
                selected: true,
            }
        ]
    },
    events: {
        type: [
            {
                id: {
                    type: Schema.Types.ObjectId,
                    ref: 'event'
                },
                yourSide: {
                    type: String,
                    default: ''
                },
                endDate: {
                    type: String,
                    default: ''
                }
            }
        ]
    },
    total_results: {
        wins: {
            type: Number,
            default: 0
        },
        loses: {
            type: Number,
            default: 0
        },
        draws: {
            type: Number,
            default: 0
        },
        winning_percentage: {
            type: String,
            default: '0%'
        },
    },
    season_results: {
        wins: {
            type: Number,
            default: 0
        },
        loses: {
            type: Number,
            default: 0
        },
        draws: {
            type: Number,
            default: 0
        },
        consecutive_rank_wins: {
            type: Number,
            default: 0
        },
        consecutive_rank_loses: {
            type: Number,
            default: 0
        },
        consecutive_wins: {
            type: Number,
            default: 0
        },
        consecutive_loses: {
            type: Number,
            default: 0
        },
        winning_percentage: {
            type: String,
            default: '0%'
        },
        results: []
    },
    rank: {
        type: Schema.Types.ObjectId,
        ref: 'rank'
    }
}, {
    timestamps: true
})

UserSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt()
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

UserSchema.statics.login = async function (username, password) {
    const user = await this.findOne({ username })
    if (user) {
        const auth = await bcrypt.compare(password, user.password)
        if (auth) {
            return user
        }
        throw Error('incorrect password')
    }
    throw Error('incorrect username')
}

const User = mongoose.model('user', UserSchema)
module.exports = User
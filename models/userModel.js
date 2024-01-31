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
    coins: {
        type: Number,
        default: 0
    },
    games_played: {
        type: Number,
        default: 0
    },
    stats: {
        type: [{
            games_played: {
                type: Number,
                default: 0
            },
            points: {
                type: Number,
                default: 0
            }
        }]
    },
    roles: {
        type: [String],
        default: ['client']
    },
    disabled: {
        type: Boolean,
        default: false
    }
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
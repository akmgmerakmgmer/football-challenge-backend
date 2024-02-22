const mongoose = require('mongoose')
const Schema = mongoose.Schema

const QuestionSchema = new Schema({
    question: {
        en: {
            type: String,
            required: [true, 'field_required']
        },
        ar: {
            type: String,
            required: [true, 'field_required']
        },
    },
    choices: [{
        en: {
            type: String,
        },
        ar: {
            type: String
        },
        value: {
            type: String
        }
    }],
    hints: [
        {
            en: {
                type: String,
            },
            ar: {
                type: String
            },
            value: {
                type: String
            }
        }
    ],
    teamImage: {
        type: String
    },
    teamPlayers: {
        type: []
    },
    answer: {
        type: Schema.Types.Mixed,
        required: [true, 'field_required']
    },
    questionMode: {
        type: String,
        default: 'multipleChoices'
    },
    mode: {
        type: String,
        default: 'general'
    },
    difficulty: {
        type: String,
        required: [true, 'field_required']
    }
}, {
    timestamps: true
})


const Question = mongoose.model('question', QuestionSchema)
module.exports = Question
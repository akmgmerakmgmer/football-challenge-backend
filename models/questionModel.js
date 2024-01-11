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
    answer: {
        type: String,
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
})


const Question = mongoose.model('question', QuestionSchema)
module.exports = Question
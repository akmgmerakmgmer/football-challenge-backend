const mongoose = require('mongoose')
const Schema = mongoose.Schema

const SystemModel = new Schema({
    current_season: {
        title: {
            en: {
                type: String,
                default: 'Season 1'
            },
            ar: {
                type: String,
                default: 'الموسم 1'
            }
        },
        endDate: {
            type: String,
            default: '11-1-2025'
        }
    },
    lowestBuildNumber: {
        type: String,
        default: '25'
    }
}, {
    timestamps: true
})


const System = mongoose.model('system', SystemModel)
module.exports = System
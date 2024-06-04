const mongoose = require('mongoose')
const Schema = mongoose.Schema
function validateURL(url) {
    // Regular expression to match URL format
    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
    return urlRegex.test(url);
}
const AdvertismentSchema = new Schema({
    image: {
        type: String,
        required: [true, 'field_required']
    },
    company: {
        type: String,
        required: [true, 'field_required']
    },
    headline: {
        en: {
            type: String,
            required: [true, 'field_required']
        },
        ar: {
            type: String,
            required: [true, 'field_required']
        }
    },
    advertiseAt: {
        type: String,
        required: [true, 'field_required']
    },
    priority: {
        type: Number,
        required: [true, 'field_required']
    },
    status: {
        type: String,
        default: 'active'
    },
    directionLink: {
        type: String,
        required: [true, 'field_required'],
        validate: {
            validator: validateURL,
            message: 'invalid_link_format'
        }
    },
    clicks: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

const Advertisment = mongoose.model('advertisment', AdvertismentSchema)
module.exports = Advertisment
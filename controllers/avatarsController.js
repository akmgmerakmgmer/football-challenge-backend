const moment = require('moment');
const Avatar = require("../models/avatarsModel")
const { handleErrors } = require('../utilities/handle_errors')

const create_avatar = (req, res, next) => {
    Avatar.create(req.body).then(avatar => {
        res.status(200).send(avatar)
    }).catch(err => {
        res.status(422).send(handleErrors(err, req, 'avatar'))
    })
}

const get_avatars = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 8
    const currentDate = moment(new Date()).format('YYYY-MM-DD');
    Avatar.find({
        $or: [
            { endDate: { $gte: currentDate } }, // Avatars with endDate greater than or equal to current date
            { endDate: { $in: ["", null] } } // Avatars without an endDate (default empty string)
        ]
    }).count().then(total_avatars => {
        Avatar.find({
            $or: [
                { endDate: { $gte: currentDate } }, // Avatars with endDate greater than or equal to current date
                { endDate: { $in: ["", null] } }// Avatars without an endDate (default empty string)
            ]
        })
            .sort({ createdAt: -1 })
            .skip(page * per_page)
            .limit(per_page)
            .lean()
            .then(avatars => res.status(200).send({ avatars, total_avatars, per_page }))
            .catch(next);
    });

}

const get_admin_avatars = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 30
    Avatar.find({}).count().then(total_avatars => {
        Avatar.find({}).skip(page * per_page).limit(per_page).then(avatars => res.status(200).send({ avatars, total_avatars, per_page })).catch(next)
    })
}

const get_single_avatar = (req, res, next) => {
    Avatar.findById({ _id: req.params.id }).then(avatar => res.status(200).send(avatar)).catch(next)
}

const update_avatar = (req, res, next) => {
    Avatar.findByIdAndUpdate({ _id: req.params.id }, req.body).then(avatar => {
        Avatar.findOne({ _id: req.params.id }).then(avatar => res.status(200).send(avatar))
    }).catch(next)
}

const delete_avatar = (req, res, next) => {
    Avatar.findByIdAndDelete({ _id: req.params.id }).then(avatar => {
        res.status(200).send(avatar)
    }).catch(next)
}


module.exports = { create_avatar, update_avatar, get_single_avatar, get_admin_avatars, get_avatars, delete_avatar }
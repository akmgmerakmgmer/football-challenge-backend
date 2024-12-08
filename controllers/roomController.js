const Room = require("../models/roomModel")
const User = require("../models/userModel")
const { handleErrors } = require('../utilities/handle_errors')

const create_room = (req, res, next) => {
    const payload = {
        players: [req.body.userId]
    }
    Room.create(payload).then(room => {
        User.findById({_id:req.body.userId})
        res.status(200).send(room)
    }).catch(err => {
        res.status(422).send(handleErrors(err, req, 'room'))
    })
}

const get_rooms = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 8
    Room.find({}).count().then(total_rooms => {
        Room.find({}).sort({ createdAt: -1 }).skip(page * per_page).limit(per_page).then(rooms => res.status(200).send({ rooms, total_rooms, per_page })).catch(next)
    })
}

const get_admin_rooms = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 30
    Room.find({}).count().then(total_rooms => {
        Room.find({}).skip(page * per_page).limit(per_page).then(rooms => res.status(200).send({ rooms, total_rooms, per_page })).catch(next)
    })
}

const get_single_room = (req, res, next) => {
    Room.findById({ _id: req.params.id }).then(room => res.status(200).send(room)).catch(next)
}

const update_room = (req, res, next) => {
    Room.findByIdAndUpdate({ _id: req.params.id }, req.body).then(room => {
        Room.findOne({ _id: req.params.id }).then(room => res.status(200).send(room))
    }).catch(next)
}

const delete_room = (req, res, next) => {
    Room.findByIdAndDelete({ _id: req.params.id }).then(room => {
        res.status(200).send(room)
    }).catch(next)
}


module.exports = { create_room, update_room, get_single_room, get_admin_rooms, get_rooms, delete_room }
const Event = require("../models/eventsModel")
const { handleErrors } = require('../utilities/handle_errors')

const create_events = (req, res, next) => {
    Event.create(req.body).then(events => {
        res.status(200).send(events)
    }).catch(err => {
        res.status(422).send(handleErrors(err, req, 'events'))
    })
}

const get_events = async (req, res, next) => {
    Event.find({ active: true }).then(events => {
        res.status(200).send(events)
    }).catch(next)
}

const get_admin_events = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 30
    Event.find({}).count().then(total_events => {
        Event.find({}).skip(page * per_page).limit(per_page).then(events => res.status(200).send({ events, total_events, per_page })).catch(next)
    })
}

const get_single_events = (req, res, next) => {
    Event.findById({ _id: req.params.id }).then(events => res.status(200).send(events)).catch(next)
}

const update_events = (req, res, next) => {
    Event.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true }).then(events => res.status(200).send(events)).catch(next)
}

const delete_events = (req, res, next) => {
    Event.findByIdAndDelete({ _id: req.params.id }).then(events => res.status(200).send(events)).catch(next)
}


module.exports = { create_events, update_events, get_single_events, get_admin_events, get_events, delete_events }
const Event = require("../models/eventsModel")
const { handleErrors } = require('../utilities/handle_errors')

const create_events = (req, res, next) => {
    Event.create(req.body).then(events => {
        res.status(200).send(events)
    }).catch(err => {
        res.status(422).send(handleErrors(err, req, 'event'))
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
    Event.findById({ _id: req.params.id })
        .populate({
            path: 'rankings.userId',
            select: 'selectedAvatar username'
        })
        .then(event => res.status(200).send(event))
        .catch(next);
};
const update_events = async (req, res, next) => {
    const eventUpdates = req.body;
    const currentEvent = await Event.findById({ _id: req.params.id });
    if ((currentEvent.active !== eventUpdates.active) || (currentEvent.endDate !== eventUpdates.endDate)) {
        eventUpdates.rankings = [];
        eventUpdates.total_points = 0;
        eventUpdates.games_played = 0;
        eventUpdates.sides = [];
        eventUpdates.number_of_players = 0;
    }
    Event.findByIdAndUpdate({ _id: req.params.id }, eventUpdates, { new: true }).then(event => res.status(200).send(event)).catch(next)
}

const delete_events = (req, res, next) => {
    Event.findByIdAndDelete({ _id: req.params.id }).then(event => res.status(200).send(event)).catch(next)
}



module.exports = { create_events, update_events, get_single_events, get_admin_events, get_events, delete_events }
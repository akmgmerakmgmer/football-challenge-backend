const Event = require("../models/eventsModel");
const User = require("../models/userModel");
const { handleErrors } = require('../utilities/handle_errors');
const { eventResults } = require("./usersController.min");
const cron = require('node-cron');

async function scheduleEventEndJob(eventId, next) {
    const event = await Event.findById({ _id: eventId });
    if (event && event.endDate) {
        const endDate = new Date(event.endDate);
        if (!isNaN(endDate.getTime())) {
            // Calculate delay until midnight after endDate
            const runDate = new Date(endDate);
            runDate.setDate(runDate.getDate() + 1);
            runDate.setHours(0, 0, 0, 0);
            const delay = runDate.getTime() - Date.now();
            if (delay > 0) {
                setTimeout(async () => {
                    const currentEvent = await Event.findById({ _id: eventId });
                    console.log('setTimeout CALLED: EVENT END JOB');
                    for (let i in currentEvent.rankings) {
                        let user = await User.findById({ _id: currentEvent.rankings[i].userId });
                        if (user) {
                            user = eventResults(user, currentEvent);
                            try {
                                await User.findByIdAndUpdate({ _id: user._id }, user, { new: true });
                            } catch (err) {
                                next();
                            }
                        }
                    }
                }, delay);
            }
        }
    }
}
const create_events = (req, res, next) => {
    Event.create(req.body).then(event => {
        res.status(200).send(event);
        scheduleEventEndJob(event['_id'], next);
    }).catch(err => {
        res.status(422).send(handleErrors(err, req, 'event'));
    });
};

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
        eventUpdates.number_of_players = 0;
        if (currentEvent.sides.length) {
            for (let i in currentEvent.sides) {
                currentEvent.sides[i].points = 0
                currentEvent.sides[i].numberOfPlayers = 0
            }
        }
    }
    Event.findByIdAndUpdate({ _id: req.params.id }, eventUpdates, { new: true }).then(event => {
        res.status(200).send(event);
        scheduleEventEndJob(event['_id'], next);
    }).catch(next)
}

const delete_events = (req, res, next) => {
    Event.findByIdAndDelete({ _id: req.params.id }).then(event => res.status(200).send(event)).catch(next)
}



module.exports = { create_events, update_events, get_single_events, get_admin_events, get_events, delete_events }
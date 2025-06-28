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
            const sec = endDate.getSeconds();
            const min = endDate.getMinutes();
            const hour = endDate.getHours();
            const day = endDate.getDate();
            const month = endDate.getMonth() + 1; // node-cron months are 1-based
            const cronExp = `${sec} ${min} ${hour} ${day} ${month} *`;
            cron.schedule(cronExp, async () => {
                console.log('CRON CALLED: EVENT END JOB');
                for (let i in event.rankings) {
                    let user = await User.findById({ _id: event.rankings[i].userId });
                    if (user) {
                        user = eventResults(user, event);
                        User.findByIdAndUpdate({ _id: user._id }, user, { new: true })
                            .then(updatedUser => {
                            }).catch(err => {
                                next();
                            });
                    }
                }
            });
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
    }
    Event.findByIdAndUpdate({ _id: req.params.id }, eventUpdates, { new: true }).then(event => {
        scheduleEventEndJob(event['_id'], next);
        res.status(200).send(event);
    }).catch(next)
}

const delete_events = (req, res, next) => {
    Event.findByIdAndDelete({ _id: req.params.id }).then(event => res.status(200).send(event)).catch(next)
}



module.exports = { create_events, update_events, get_single_events, get_admin_events, get_events, delete_events }
const Event = require('../../models/eventsModel');
const { getUser } = require('../../utilities/user_general_methods');
const { getCurrentDate } = require('./userUtils');

const eventResults = async (user) => {
    if (user?.events?.length) {
        for (const userEvent of user.events) {
            if (userEvent?.id) {
                let winningSide = '';
                const currentDate = getCurrentDate();
                const event = await Event.findById({ _id: userEvent.id });
                if (event && currentDate > event.endDate) {
                    let maxPoints = 0;
                    for (const side of event.sides) {
                        if (side.points > maxPoints) {
                            maxPoints = side.points;
                            winningSide = side._id;
                        }
                    }
                    for (const prize of event.prizes) {
                        prize.message = {
                            en: `${event.eventName.en} Event`,
                            ar: `تحدي ${event.eventName.ar}`
                        };
                    }
                    if (winningSide.toString() === userEvent.yourSide.toString()) {
                        user.prizes = [...user.prizes, ...event.prizes];
                    }
                    user.events = user.events.filter(
                        e => e?.id && e.id.toString() !== event._id.toString()
                    );
                }
            }
        }
    }
    return user;
};

const addPointsToEvents = async (userEvents, eventId, points) => {
    const userSide = userEvents.find(userEvent => userEvent.id.toString() === eventId)?.yourSide;
    const event = await Event.findById({ _id: eventId });
    const currentDate = getCurrentDate();
    if (event && currentDate <= event.endDate) {
        event.total_points += points;
        for (const side of event.sides) {
            if (userSide === side._id.toString()) side.points += points;
        }
        await Event.findByIdAndUpdate({ _id: eventId }, event);
    }
};

const add_event_to_user = async (req, res, next) => {
    const eventPayload = {
        id: req.body.eventId,
        yourSide: req.body.sideId,
        endDate: req.body.endDate,
        gamesPlayed: 0,
    };
    Event.findById({ _id: req.body.eventId }).then(event => {
        for (const side of event.sides) {
            if (side._id.toString() === req.body.sideId) {
                side.numberOfPlayers += 1;
                Event.findByIdAndUpdate({ _id: req.body.eventId }, event).then(() => {
                    getUser(req.params.id, { $inc: { coins: -req.body.price }, $push: { events: eventPayload } }, res, next);
                });
            }
        }
    });
};

module.exports = {
    eventResults,
    addPointsToEvents,
    add_event_to_user
}; 
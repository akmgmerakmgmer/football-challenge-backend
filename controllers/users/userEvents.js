const Event = require('../../models/eventsModel');
const { getUser } = require('../../utilities/user_general_methods');
const { getCurrentDate } = require('./userUtils');


const teamEventResultPoints = (user, event, userEvent) => {
    let winningSide = '';
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
const singlePlayerEventResultPoints = (user, event) => {
    const userRankIndex = event.rankings.findIndex(rank => rank.userId.toString() === user._id.toString());

    if (userRankIndex !== -1 && event.prizes && event.prizes[userRankIndex]) {
        // Add message to the prize before adding it to user's prizes
        const prize = {
            ...event.prizes[userRankIndex],
            message: {
                en: `${event.eventName.en} Event - Rank ${userRankIndex + 1}`,
                ar: `تحدي ${event.eventName.ar} - المرتبة ${userRankIndex + 1}`
            }
        };
        user.prizes.push(prize);
    }

    // Remove the event from user's events list
    user.events = user.events.filter(
        e => e?.id && e.id.toString() !== event._id.toString()
    );

    return user;
};
const eventResults = async (user) => {
    let updatedUser = user;
    if (updatedUser?.events?.length) {
        for (const userEvent of updatedUser.events) {
            if (userEvent?.id) {
                const currentDate = getCurrentDate();
                const event = await Event.findById({ _id: userEvent.id });
                if (event && currentDate > event.endDate) {
                    if (event.isSinglePlayer) {
                        updatedUser = singlePlayerEventResultPoints(updatedUser, event);
                    } else if (!event.isMultiplayer) {
                        updatedUser = teamEventResultPoints(updatedUser, event, userEvent);
                    }
                }
            }
        }
    }
    return updatedUser;
};

const teamEventPoints = (userEvents, eventId, points, event) => {
    const userSide = userEvents.find(userEvent => userEvent.id.toString() === eventId)?.yourSide;
    event.total_points += points;
    for (const side of event.sides) {
        if (userSide === side._id.toString()) side.points += points;
    }
    return event;
}

const singlePlayerEventPoints = (userId, points, event) => {
    const existingRankingIndex = event.rankings.findIndex(rank => rank.userId.toString() === userId);
    if (existingRankingIndex !== -1) {
        event.rankings[existingRankingIndex].points = points;
    } else if (event.rankings.length < 5) {
        event.rankings.push({ userId, points });
    } else {
        // Check if current points are higher than the lowest ranking
        const lowestRanking = event.rankings[event.rankings.length - 1];
        if (points > lowestRanking.points) {
            event.rankings[event.rankings.length - 1] = { userId, points };
        }
    }

    // Sort rankings by points in descending order
    event.rankings.sort((a, b) => b.points - a.points);

    return event;
}

const addPointsToEvents = async (userEvents, eventId, points, userId) => {
    let event = await Event.findById({ _id: eventId });
    const currentDate = getCurrentDate();
    if (event && currentDate <= event.endDate) {
        if (event.isSinglePlayer) {
            event = singlePlayerEventPoints(userId, points, event);
        } else if (!event.isMultiplayer) {
            event = teamEventPoints(userEvents, eventId, points, event);
        }
        await Event.findByIdAndUpdate({ _id: eventId }, event);
    }
};

const add_event_to_user = async (req, res, next) => {
    const event = await Event.findById({ _id: req.body.eventId });
    const eventPayload = {
        id: req.body.eventId,
        endDate: req.body.endDate,
        gamesPlayed: 0,
        points: 0
    };
    event.number_of_players += 1;
    if (event && !event.isMultiplayer && !event.isSinglePlayer) {
        eventPayload.yourSide = req.body.sideId;
        for (const side of event.sides) {
            if (side._id.toString() === req.body.sideId) {
                side.numberOfPlayers += 1;
            }
        }
    }
    Event.findByIdAndUpdate({ _id: req.body.eventId }, event).then(() => {
        getUser(req.params.id, { $inc: { coins: -req.body.price }, $push: { events: eventPayload } }, res, next);
    });


};

module.exports = {
    eventResults,
    addPointsToEvents,
    add_event_to_user
}; 
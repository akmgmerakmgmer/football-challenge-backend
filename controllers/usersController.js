const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const moment = require('moment');
const Perk = require('../models/perksModel');
const Avatar = require('../models/avatarsModel');
const Event = require('../models/eventsModel');
const Theme = require('../models/themesModel');
const Room = require('../models/roomModel');
const { getUser, findUser, updateAndGetUser } = require('../utilities/user_general_methods');

const get_users = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 16
    User.find({ $and: [{ username: { $regex: req.query.username, $options: "i" } }, { number: { $regex: req.query.number, $options: "i" } }] }).count().then(total_users => {
        User.find({ $and: [{ username: { $regex: req.query.username, $options: "i" } }, { number: { $regex: req.query.number, $options: "i" } }] }).sort({ createdAt: -1 }).skip(page * per_page).limit(per_page).then(user => res.status(200).send({ user, total_users, per_page })).catch(next)
    })
}

const checkIfFreeCoinsAvailable = (user) => {
    const currentDate = moment(new Date()).format('YYYY-MM-DD')
    if (user && user.free_coins && (!user.free_coins.date || user.free_coins.date !== currentDate)) {
        user.free_coins.date = currentDate
        user.free_coins.numberOfTimes = 0
    }
    return user
}

const eventResults = async (user, prizes) => {
    if (user && user.events && user.events.length) {
        for (let i in user.events) {
            if (user.events[i] && user.events[i].id) {
                let winningSide = ''
                const currentDate = moment(new Date()).format('YYYY-MM-DD')
                await Event.findById({ _id: user.events[i].id }).then(event => {
                    if (event && currentDate > event.endDate) {
                        let maxPoints = 0
                        for (let x in event.sides) {
                            if (event.sides[x].points > maxPoints) {
                                maxPoints = event.sides[x].points
                                winningSide = event.sides[x]._id
                            }
                        }
                        for (let j in event.prizes) {
                            event.prizes[j].message = { en: `${event.eventName.en} Event`, ar: `تحدي ${event.eventName.ar}` }
                        }
                        if (winningSide.toString() === user.events[i].yourSide.toString()) user.prizes = [...user.prizes, ...event.prizes]
                        user.events = user.events.filter(userEvent => userEvent && userEvent.id && userEvent.id.toString() !== event._id.toString())
                    }
                })
            }
        }
    }
    return user
}

const changeSeason = (user) => {
    if (user && user.current_season !== user.system_info.current_season.title.en) {
        const season_results_defaults = {
            "results": [],
            "consecutive_rank_wins": 0,
            "consecutive_rank_loses": 0,
            "winning_percentage": "0%",
            "wins": 0,
            "loses": 0,
            "draws": 0,
            "consecutive_wins": 0,
            "consecutive_loses": 0
        }
        user.prev_seasons_ranks.push(user.rank._id)
        user.rank = user.rank.season_end_rank
        user.season_results = season_results_defaults
        user.current_season = user.system_info.current_season.title.en
    }
    return user
}

const changeLoginDayData = (user) => {
    if (user && user.login_data && user.login_data.last_login_day_data) {
        user.login_data.total_logins += 1
        const currentDate = moment(new Date()).format('YYYY-MM-DD')
        if (currentDate === user.login_data.last_login_day_data.day) user.login_data.last_login_day_data.total_day_logins += 1
        else {
            user.login_data.last_login_day_data.total_day_logins = 1
            user.login_data.last_login_day_data.day += currentDate
        }
    }
    return user
}

const get_current_user = (req, res, next) => {
    const token = req.body.data.token
    if (token) {
        jwt.verify(token, 'ecommerce secret to help jwt token', async (err, decodedToken) => {
            if (err) {
                res.sendStatus(401)
            } else {
                let user = await findUser(decodedToken.id)
                user = changeLoginDayData(user)
                user = checkIfFreeCoinsAvailable(user)
                user = await eventResults(user)
                user = changeSeason(user)
                let prizes = user && user.prizes
                if (prizes && prizes.length) {
                    for (let i in prizes) {
                        if (prizes[i].prizeType == 'coins') user.coins += prizes[i].coins
                        if (prizes[i].prizeType == 'avatar') user.avatars.push({ image: prizes[i].avatar, price: 0 })
                        if (prizes[i].prizeType == 'theme') user.themes.push(prizes[i].theme)
                    }
                }
                if (user && user.prizes) user.prizes = []
                user = await updateAndGetUser(decodedToken.id, user)
                res.status(200).send({ user, prizes })
            }
        })
    }
}

const get_single_user = async (req, res, next) => {
    await findUser(req.params.id)
}

const delete_user = (req, res, next) => {
    User.findByIdAndDelete({ _id: req.params.id }).then(user => {
        res.status(200).send(user)
    }).catch(next)
}

const update_user = (req, res, next) => {
    if (req.body.username) {
        User.findById({ _id: req.params.id }).then(user => {
            if (user.username === req.body.username) {
                getUser(req.params.id, req.body, res, next)
            } else {
                User.findOne({ username: req.body.username }).then(user => {
                    if (user) {
                        return res.status(422).send({ message: 'username_unique' })
                    } else {
                        getUser(req.params.id, req.body, res, next)
                    }
                })
            }
        })
    } else {
        getUser(req.params.id, req.body, res, next)
    }
}

const select_perk = (req, res, next) => {
    User.findById({ _id: req.params.id }).then(user => {
        user.perks[req.body.index].selected = true
        getUser(req.params.id, user, res, next)
    }).catch(next)
}

const remove_perk = (req, res, next) => {
    User.findById({ _id: req.params.id }).then(user => {
        user.perks[req.body.index].selected = false
        getUser(req.params.id, user, res, next)
    }).catch(next)
}

const add_coins = async (req, res, next) => {
    const user = await User.findById({ _id: req.params.id })
    if (user) {
        const currentDate = moment(new Date()).format('YYYY-MM-DD');
        if (user.free_coins.date !== currentDate) {
            user.free_coins.date = currentDate
            user.free_coins.numberOfTimes = 1
        } else {
            if (user.free_coins.numberOfTimes >= 3) return res.status(400).send({ message: 'maximum_times_reached' })
            user.free_coins.numberOfTimes += 1
        }
        user.coins += req.body.coins
        getUser(req.params.id, user, res, next)
    } else {
        res.status(400).send({ message: 'user_not_found' })
    }
}


function getLastSaturday(currentDate) {
    // Get the current day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)
    const currentDayOfWeek = currentDate.getDay();

    // Calculate the difference in days to get to the last Saturday
    const daysToLastSaturday = currentDayOfWeek === 6 ? 0 : currentDayOfWeek + 1;

    // Subtract the difference from the current date to get the last Saturday
    const lastSaturday = new Date(currentDate);
    lastSaturday.setDate(currentDate.getDate() - daysToLastSaturday);

    // Convert the date to 'YYYY-MM-DD' format using moment.js
    return moment(lastSaturday).format('YYYY-MM-DD');
}
function getSaturdayBeforeLast(currentDate) {
    // Get the last Saturday
    const lastSaturday = getLastSaturday(currentDate);

    // Convert the last Saturday to a Date object
    const lastSaturdayDate = new Date(lastSaturday);

    // Subtract 7 days to get the Saturday before the last Saturday
    const saturdayBeforeLast = new Date(lastSaturdayDate);
    saturdayBeforeLast.setDate(lastSaturdayDate.getDate() - 7);
    // Convert the date to 'YYYY-MM-DD' format using moment.js
    return moment(saturdayBeforeLast).format('YYYY-MM-DD');
}
const numberOfDaysToPlayerLastSaturday = (playerLastSaturday) => {
    // Example usage:
    var currentDate = moment(new Date(), 'YYYY-MM-DD');
    var playerDate = moment(playerLastSaturday, 'YYYY-MM-DD'); // Use any current date here
    const differenceInDays = currentDate.diff(playerDate, 'days');
    return differenceInDays;

}
const getCurrentDay = () => {
    let today = new Date();
    function addLeadingZero(num) {
        return num < 10 ? `0${num}` : num;
    }
    let day = addLeadingZero(today.getDate());
    let month = addLeadingZero(today.getMonth() + 1); // Months are zero-based
    let year = today.getFullYear();
    return `${year}-${month}-${day}`;
}
const addPointsToEvents = async (userEvents, eventId, points) => {
    const userSide = userEvents.filter((userEvent) => userEvent.id.toString() === eventId)[0].yourSide
    await Event.findById({ _id: eventId }).then(async event => {
        const currentDate = moment(new Date()).format('YYYY-MM-DD')
        if (currentDate <= event.endDate) {
            event.total_points += points;
            for (let i in event.sides) {
                if (userSide === event.sides[i]._id.toString()) event.sides[i].points += points
                await Event.findByIdAndUpdate({ _id: eventId }, event).then(res => { })
            }
        }
    })
}
const user_save_game = (req, res, next) => {
    const { coins, points, usedPerks, eventId } = req.body

    User.findById({ _id: req.params.id }).then(async user => {
        if (eventId) await addPointsToEvents(user.events, eventId, points)
        const currentDate = new Date();
        const yearlyPoints = user.user_points.yearlyPoints
        const monthlyPoints = user.user_points.monthlyPoints
        const weeklyPoints = user.user_points.weeklyPoints
        const dailyPoints = user.user_points.dailyPoints
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1
        // Calculate Yearly Points
        if (!eventId) {
            if (yearlyPoints.length && yearlyPoints[yearlyPoints.length - 1].year === currentYear) {
                yearlyPoints[yearlyPoints.length - 1].points += points
                yearlyPoints[yearlyPoints.length - 1].games_played += 1
            } else yearlyPoints.push({ points: points, year: currentYear, games_played: 1 })

            //Calculate Monthly Points
            if (monthlyPoints.length &&
                monthlyPoints[monthlyPoints.length - 1].year === currentYear &&
                monthlyPoints[monthlyPoints.length - 1].month === currentMonth) {
                monthlyPoints[monthlyPoints.length - 1].points += points
                monthlyPoints[monthlyPoints.length - 1].games_played += 1
            } else monthlyPoints.push({ year: currentYear, month: currentMonth, points: points, games_played: 1 })

            //Calculate Weekly Points
            if (weeklyPoints.length && numberOfDaysToPlayerLastSaturday(weeklyPoints[weeklyPoints.length - 1].weekDate) < 7) {
                weeklyPoints[weeklyPoints.length - 1].points += points
                weeklyPoints[weeklyPoints.length - 1].games_played += 1
                weeklyPoints[weeklyPoints.length - 1].weekDate = getLastSaturday(new Date())
            } else weeklyPoints.push({ weekDate: getLastSaturday(new Date()), points: points, games_played: 1 })

            //Calculate Daily Points
            if (dailyPoints.day === getCurrentDay()) {
                dailyPoints.points += points
                dailyPoints.games_played += 1
            }
            else {
                dailyPoints.points = points
                dailyPoints.games_played = 1
                dailyPoints.day = getCurrentDay()
            }
        }

        if (usedPerks.length) {
            for (let i in user.perks) {
                if (usedPerks.indexOf(user.perks[i].id.toString()) > -1) {
                    user.perks[i].quantity -= 1
                }
            }
        }
        // Assign Values to user
        user.user_points.totalPoints += points
        user.coins += coins
        user.games_played += 1
        getUser(req.params.id, user, res, next, true)
    }).catch(next)
}

const getUserPoints = (req, user) => {
    if (req.query.searchByTime === 'daily' && user.user_points.dailyPoints && user.user_points.dailyPoints.points) return { points: user.user_points.dailyPoints.points, games_played: user.user_points.dailyPoints.games_played }

    if (req.query.searchByTime === 'weekly' && user.user_points.weeklyPoints.length) {
        for (let i = 0; i < user.user_points.weeklyPoints.length; i++) {
            if (req.query.week === 'thisWeek' && user.user_points.weeklyPoints[i].weekDate === getLastSaturday(new Date())) return { points: user.user_points.weeklyPoints[i].points, games_played: user.user_points.weeklyPoints[i].games_played }
            if (req.query.week === 'lastWeek' && user.user_points.weeklyPoints[i].weekDate === getSaturdayBeforeLast(new Date())) return { points: user.user_points.weeklyPoints[i].points, games_played: user.user_points.weeklyPoints[i].games_played }
        }
    }

    if (req.query.searchByTime === 'monthly' && user.user_points.monthlyPoints.length) {
        const monthlyPoints = user.user_points.monthlyPoints
        for (let i in monthlyPoints) {
            if (monthlyPoints[i].year === parseInt(req.query.year) && monthlyPoints[i].month === parseInt(req.query.month)) return { points: monthlyPoints[i].points, games_played: monthlyPoints[i].games_played }
        }
    }

    if (req.query.searchByTime === 'yearly' && user.user_points.yearlyPoints.length) {
        const yearlyPoints = user.user_points.yearlyPoints
        for (let i in yearlyPoints) {
            if (yearlyPoints[i].year === parseInt(req.query.year)) return { points: yearlyPoints[i].points, games_played: yearlyPoints[i].games_played }
        }
    }
    return { points: 0, games_played: 0 }
}
const matchFilters = (req) => {
    const match = { $and: [{ $or: [{ username: { $regex: req.query.search, $options: "i" } }] }] }
    if (req.query.searchByTime === 'daily') match.$and.push({ "user_points.dailyPoints.day": getCurrentDay() })
    else if (req.query.searchByTime === 'weekly') match.$and.push({ "user_points.weeklyPoints.weekDate": req.query.week === 'thisWeek' ? getLastSaturday(new Date()) : getSaturdayBeforeLast(new Date()) })
    else if (req.query.searchByTime === 'monthly') match.$and.push({ "user_points.monthlyPoints.year": parseInt(req.query.year), "user_points.monthlyPoints.month": parseInt(req.query.month) })

    else if (req.query.searchByTime === 'yearly') match.$and.push({ "user_points.yearlyPoints.year": parseInt(req.query.year) })
    return match
}
const userMatchFilters = (req, user) => {
    const match = { $and: [{ $or: [{ username: { $regex: req.query.search, $options: "i" } }] }] }
    if (req.query.searchByTime === 'daily') match.$and.push({ 'user_points.weeklyPoints.points': { $gt: getUserPoints(req, user).points || 0 }, "user_points.dailyPoints.day": getCurrentDay() })
    else if (req.query.searchByTime === 'weekly') match.$and.push({ 'user_points.weeklyPoints.points': { $gt: getUserPoints(req, user).points || 0 }, "user_points.weeklyPoints.weekDate": req.query.week === 'thisWeek' ? getLastSaturday(new Date()) : getSaturdayBeforeLast(new Date()) })
    else if (req.query.searchByTime === 'monthly') match.$and.push({ 'user_points.weeklyPoints.points': { $gt: getUserPoints(req, user).points || 0 }, "user_points.monthlyPoints.year": parseInt(req.query.year), "user_points.monthlyPoints.month": parseInt(req.query.month) })

    else if (req.query.searchByTime === 'yearly') match.$and.push({ 'user_points.weeklyPoints.points': { $gt: getUserPoints(req, user).points || 0 }, "user_points.yearlyPoints.year": parseInt(req.query.year) })
    return match
}
const unwindUsers = (req) => {
    if (req.query.searchByTime === 'daily') return "$user_points.dailyPoints"
    if (req.query.searchByTime === 'weekly') return "$user_points.weeklyPoints"
    if (req.query.searchByTime === 'monthly') return "$user_points.monthlyPoints"
    if (req.query.searchByTime === 'yearly') return "$user_points.yearlyPoints"
}
const sortUsers = (req) => {
    if (req.query.searchByTime === 'daily') return { "user_points.dailyPoints.points": -1 }
    if (req.query.searchByTime === 'weekly') return { "user_points.weeklyPoints.points": -1 }
    if (req.query.searchByTime === 'monthly') return { "user_points.monthlyPoints.points": -1 }
    if (req.query.searchByTime === 'yearly') return { "user_points.yearlyPoints.points": -1 }
}
const updatedSortedUsers = (sortedUsers, searchTime) => {
    for (let i in sortedUsers) {
        if (searchTime === 'daily') {
            const sortedUsersPoints = sortedUsers[i].user_points
            sortedUsers[i].points = sortedUsersPoints.dailyPoints.points
            sortedUsers[i].games_played = sortedUsersPoints.dailyPoints.games_played
        }
        if (searchTime === 'weekly') {
            const sortedUsersPoints = sortedUsers[i].user_points
            sortedUsers[i].points = sortedUsersPoints.weeklyPoints.points
            sortedUsers[i].games_played = sortedUsersPoints.weeklyPoints.games_played
        }
        if (searchTime === 'monthly') {
            const sortedUsersPoints = sortedUsers[i].user_points
            sortedUsers[i].points = sortedUsersPoints.monthlyPoints.points
            sortedUsers[i].games_played = sortedUsersPoints.monthlyPoints.games_played
        }
        if (searchTime === 'yearly') {
            const sortedUsersPoints = sortedUsers[i].user_points
            sortedUsers[i].points = sortedUsersPoints.yearlyPoints.points
            sortedUsers[i].games_played = sortedUsersPoints.yearlyPoints.games_played
        }
        delete sortedUsers[i].number
    }
    return sortedUsers.slice(0, 10)
}

const get_user_current_ranking = async (req, res, next) => {
    try {
        const user = await findUser(req.params.id)

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        const usersWithHigherPoints = await User.aggregate([
            { $unwind: unwindUsers(req) },
            { $match: userMatchFilters(req, user) },
            { $count: "rank" }
        ]);

        const rank = usersWithHigherPoints.length ? usersWithHigherPoints[0].rank + 1 : 1;

        user.points = getUserPoints(req, user).points;
        user.games_played = getUserPoints(req, user).games_played;

        const sortedUsers = await User.aggregate([
            { $match: matchFilters(req) },
            { $unwind: unwindUsers(req) },
            { $match: matchFilters(req) },
            { $sort: sortUsers(req) },
            { $limit: 10 },
            // Perform lookups equivalent to .populate()
            {
                $lookup: {
                    from: "ranks",
                    localField: "rank",
                    foreignField: "_id",
                    as: "rank"
                }
            },
            { $unwind: { path: "$rank", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "system_infos",
                    localField: "system_info",
                    foreignField: "_id",
                    as: "system_info"
                }
            },
            { $unwind: { path: "$system_info", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "season_results",
                    localField: "season_results.results.player",
                    foreignField: "_id",
                    as: "season_results.results.player"
                }
            },
            {
                $lookup: {
                    from: "prev_seasons_ranks",
                    localField: "prev_seasons_ranks",
                    foreignField: "_id",
                    as: "prev_seasons_ranks"
                }
            }
        ]);

        res.status(200).send({
            rank: rank,
            user: user,
            rankedUsers: updatedSortedUsers(sortedUsers, req.query.searchByTime)
        });

    } catch (err) {
        next(err);
    }
};

const get_rankings = (req, res, next) => {
    User.aggregate([
        { $match: matchFilters(req) },
        { $unwind: unwindUsers(req) },
        { $match: matchFilters(req) },
        { $sort: sortUsers(req) },
        { $limit: 10 },
        // Populate 'rank'
        {
            $lookup: {
                from: "ranks",
                localField: "rank",
                foreignField: "_id",
                as: "rank"
            }
        },
        { $unwind: { path: "$rank", preserveNullAndEmptyArrays: true } },
        // Populate 'system_info'
        {
            $lookup: {
                from: "system_infos",
                localField: "system_info",
                foreignField: "_id",
                as: "system_info"
            }
        },
        { $unwind: { path: "$system_info", preserveNullAndEmptyArrays: true } },
        // Populate 'prev_seasons_ranks'
        {
            $lookup: {
                from: "prev_seasons_ranks",
                localField: "prev_seasons_ranks",
                foreignField: "_id",
                as: "prev_seasons_ranks"
            }
        },
        // Populate 'season_results.results.player'
        {
            $lookup: {
                from: "users", // Assuming 'player' is a reference to the 'users' collection
                localField: "season_results.results.player",
                foreignField: "_id",
                as: "season_results.results.player"
            }
        }
    ])
        .then((sortedUsers) => {
            res.status(200).send({ rankedUsers: updatedSortedUsers(sortedUsers, req.query.searchByTime) });
        })
        .catch((err) => {
            next(err);
        });
};


const buy_avatar = async (req, res, next) => {
    const user = await findUser(req.params.id)
    for (let i in user.avatars) {
        if (user.avatars[i].image === req.body.avatar.image) return res.status(422).send({ message: { en: "You already have this avatar", ar: "انت بالفعل لديك هذا الرمز" } })
    }
    if (user.coins < req.body.avatar.price) return res.status(422).send({ message: { en: "You don't have enough coins", ar: "انت لا تملك عملات كافية" } })
    getUser(req.params.id, { $push: { avatars: req.body.avatar }, $inc: { coins: -req.body.avatar.price } }, res, next, true)
    Avatar.findOneAndUpdate({ image: req.body.avatar.image }, { $inc: { purchases: 1 } }, { new: true }).then(response => {
    })
}

const buy_theme = async (req, res, next) => {
    const user = await findUser(req.params.id)
    for (let i in user.themes) {
        if (user.themes[i] === req.body.theme.image) return res.status(422).send({ message: { en: "You already have this theme", ar: "انت بالفعل لديك هذه الخلفية" } })
    }
    if (user.coins < req.body.theme.price) return res.status(422).send({ message: { en: "You don't have enough coins", ar: "انت لا تملك عملات كافية" } })
    getUser(req.params.id, { $push: { themes: req.body.theme.image }, $inc: { coins: -req.body.theme.price }, selectedTheme: req.body.theme.image }, res, next, true)
    Theme.findOneAndUpdate({ image: req.body.theme.image }, { $inc: { purchases: 1 } }).then(response => { })
}

const buy_perks = async (req, res, next) => {
    const user = await findUser(req.params.id)
    Perk.findOne({ _id: req.body.perkId }).then(perk => {
        const isPerkWithUser = user.perks.filter(item => item.id._id.toString() === perk._id.toString()).length > 0 ? true : false
        if (user.coins < (perk.price * req.body.quantity)) return res.status(422).send({ message: { en: "You don't have enough coins", ar: "انت لا تملك عملات كافية" } })
        if (isPerkWithUser) {
            for (let i in user.perks) {
                if (user.perks[i].id._id.toString() === perk._id.toString()) {
                    user.perks[i].quantity += req.body.quantity
                }
            }
        } else {
            user.perks.push({
                id: perk._id,
                quantity: req.body.quantity,
                selected: false
            })
        }
        user.coins -= perk.price * req.body.quantity
        getUser(req.params.id, user, res, next, true)
    }).catch(next)

}


const notify_about = (req, res, next) => {
    User.findByIdAndUpdate({ _id: req.params.id }, { $push: { notifyAbout: req.body.mode } }).then(user => {
        User.findOne({ _id: req.params.id }).then(user => res.status(200).send(user))
    }).catch(next)
}

const add_event_to_user = async (req, res, next) => {
    const eventPayload = {
        id: req.body.eventId,
        yourSide: req.body.sideId,
        endDate: req.body.endDate,
    }
    Event.findById({ _id: req.body.eventId }).then(event => {
        for (let i in event.sides) {
            if (event.sides[i]._id.toString() === req.body.sideId) {
                event.sides[i].numberOfPlayers += 1
                Event.findByIdAndUpdate({ _id: req.body.eventId }, event).then(event => {
                    getUser(req.params.id, { $inc: { coins: -req.body.price }, $push: { events: eventPayload } }, res, next)
                })
            }
        }
    })
}

const calculatePercentage = (total_results) => {
    const total_games = total_results.wins + total_results.loses + total_results.draws;
    return `${Math.round((total_results.wins / total_games) * 100)}%`;
};


const addToResults = async (players, winnerId, results) => {
    if (results.length == 20) results.pop()
    const result = []
    for (let i in players) {
        const playerData = {
            player: players[i].userId._id,
            points: players[i].points,
            isWinner: players[i].userId._id.toString() == winnerId.toString()
        }
        if (players[i].isLeft) playerData.points = 0
        if (players[i].userId._id.toString() == winnerId.toString() && players[i].points === 0) playerData.points = 10
        result.push(playerData)
    }
    return [result, ...results];
}

const multi_game_winner = async (req, res, next) => {
    const { userId, players, winnerId, roomId } = req.body
    let prizes = []
    let promoted = false
    await Room.findByIdAndDelete({ _id: roomId }).then((res) => { }).catch(next)
    const user = await User.findById({ _id: userId }).populate('rank')
    user.total_results.wins += 1
    user.total_results.winning_percentage = calculatePercentage(user.total_results)
    user.season_results.wins += 1
    user.season_results.winning_percentage = calculatePercentage(user.season_results)
    user.season_results.consecutive_wins += 1
    user.season_results.consecutive_loses = 0
    user.season_results.consecutive_rank_loses = 0
    if (user.rank.wins_to_promote > 0 && user.rank.wins_to_promote <= user.season_results.consecutive_rank_wins + 1) {
        user.season_results.consecutive_rank_wins = 0
        prizes = [...user.rank.prizes]
        user.rank = user.rank.next_rank
        promoted = true
        for (let i in prizes) {
            if (prizes[i].prizeType == 'coins') user.coins += prizes[i].coins
            if (prizes[i].prizeType == 'avatar') user.avatars.push({ image: prizes[i].avatar, price: 0 })
            if (prizes[i].prizeType == 'theme') user.themes.push(prizes[i].theme)
        }
    }
    else user.season_results.consecutive_rank_wins += 1
    user.season_results.results = await addToResults(players, winnerId, user.season_results.results)
    const updatedUser = await updateAndGetUser(userId, user)
    res.status(200).send({ user: updatedUser, prizes, promoted })
}

const multi_game_loser = async (req, res, next) => {
    const { userId, players, winnerId } = req.body
    let demoted = false
    const user = await User.findById({ _id: userId }).populate('rank')
    user.total_results.loses += 1
    user.total_results.winning_percentage = calculatePercentage(user.total_results)
    user.season_results.loses += 1
    user.season_results.winning_percentage = calculatePercentage(user.season_results)
    user.season_results.consecutive_loses += 1
    user.season_results.consecutive_wins = 0
    user.season_results.consecutive_rank_wins = 0
    if (user.rank.loses_to_demote > 0 && user.rank.loses_to_demote <= user.season_results.consecutive_rank_loses + 1) {
        user.rank = user.rank.prev_rank
        user.season_results.consecutive_rank_loses = 0
        demoted = true
    }
    else user.season_results.consecutive_rank_loses += 1
    user.season_results.results = await addToResults(players, winnerId, user.season_results.results)
    const updatedUser = await updateAndGetUser(userId, user)
    res.status(200).send({ user: updatedUser, demoted })
}

const multi_game_draw = async (req, res, next) => {
    const { userId, players, winnerId } = req.body
    const user = await User.findById({ _id: userId }).populate('rank')
    user.total_results.draws += 1
    user.total_results.winning_percentage = calculatePercentage(user.total_results)
    user.season_results.draws += 1
    user.season_results.winning_percentage = calculatePercentage(user.season_results)
    user.season_results.consecutive_wins = 0
    user.season_results.consecutive_loses = 0
    user.season_results.consecutive_rank_loses = 0
    user.season_results.consecutive_rank_wins = 0
    user.season_results.results = await addToResults(players, winnerId, user.season_results.results)
    const updatedUser = await updateAndGetUser(userId, user)
    res.status(200).send({ user: updatedUser })
}

module.exports = { get_users, get_current_user, get_single_user, delete_user, update_user, user_save_game, get_user_current_ranking, get_rankings, buy_avatar, buy_theme, notify_about, buy_perks, remove_perk, select_perk, add_coins, add_event_to_user, multi_game_draw, multi_game_winner, multi_game_loser }
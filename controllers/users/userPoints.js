const User = require('../../models/userModel');
const { getCurrentDay, getLastSaturday, getSaturdayBeforeLast } = require('./userUtils.min');
const { findUser } = require('../../utilities/user_general_method.min');

const getUserPoints = (req, user) => {
    if (req.query.searchByTime === 'daily' && user.user_points.dailyPoints?.points)
        return {
            points: user.user_points.dailyPoints.points,
            games_played: user.user_points.dailyPoints.games_played
        };

    if (req.query.searchByTime === 'weekly' && user.user_points.weeklyPoints.length) {
        for (const weekly of user.user_points.weeklyPoints) {
            if (
                (req.query.week === 'thisWeek' && weekly.weekDate === getLastSaturday(new Date())) ||
                (req.query.week === 'lastWeek' && weekly.weekDate === getSaturdayBeforeLast(new Date()))
            ) {
                return { points: weekly.points, games_played: weekly.games_played };
            }
        }
    }

    if (req.query.searchByTime === 'monthly' && user.user_points.monthlyPoints.length) {
        for (const monthly of user.user_points.monthlyPoints) {
            if (
                monthly.year === parseInt(req.query.year) &&
                monthly.month === parseInt(req.query.month)
            ) {
                return { points: monthly.points, games_played: monthly.games_played };
            }
        }
    }

    if (req.query.searchByTime === 'yearly' && user.user_points.yearlyPoints.length) {
        for (const yearly of user.user_points.yearlyPoints) {
            if (yearly.year === parseInt(req.query.year)) {
                return { points: yearly.points, games_played: yearly.games_played };
            }
        }
    }
    return { points: 0, games_played: 0 };
};

const matchFilters = (req) => {
    const match = {
        $and: [
            { $or: [{ username: { $regex: req.query.search, $options: "i" } }] }
        ]
    };
    if (req.query.searchByTime === 'daily')
        match.$and.push({ "user_points.dailyPoints.day": getCurrentDay() });
    else if (req.query.searchByTime === 'weekly')
        match.$and.push({
            "user_points.weeklyPoints.weekDate":
                req.query.week === 'thisWeek'
                    ? getLastSaturday(new Date())
                    : getSaturdayBeforeLast(new Date())
        });
    else if (req.query.searchByTime === 'monthly')
        match.$and.push({
            "user_points.monthlyPoints.year": parseInt(req.query.year),
            "user_points.monthlyPoints.month": parseInt(req.query.month)
        });
    else if (req.query.searchByTime === 'yearly')
        match.$and.push({ "user_points.yearlyPoints.year": parseInt(req.query.year) });
    return match;
};

const userMatchFilters = (req, user) => {
    const match = {
        $and: [
            { $or: [{ username: { $regex: req.query.search, $options: "i" } }] }
        ]
    };
    const userPoints = getUserPoints(req, user).points || 0;
    if (req.query.searchByTime === 'daily')
        match.$and.push({
            'user_points.weeklyPoints.points': { $gt: userPoints },
            "user_points.dailyPoints.day": getCurrentDay()
        });
    else if (req.query.searchByTime === 'weekly')
        match.$and.push({
            'user_points.weeklyPoints.points': { $gt: userPoints },
            "user_points.weeklyPoints.weekDate":
                req.query.week === 'thisWeek'
                    ? getLastSaturday(new Date())
                    : getSaturdayBeforeLast(new Date())
        });
    else if (req.query.searchByTime === 'monthly')
        match.$and.push({
            'user_points.weeklyPoints.points': { $gt: userPoints },
            "user_points.monthlyPoints.year": parseInt(req.query.year),
            "user_points.monthlyPoints.month": parseInt(req.query.month)
        });
    else if (req.query.searchByTime === 'yearly')
        match.$and.push({
            'user_points.weeklyPoints.points': { $gt: userPoints },
            "user_points.yearlyPoints.year": parseInt(req.query.year)
        });
    return match;
};

const unwindUsers = (req) => {
    if (req.query.searchByTime === 'daily') return "$user_points.dailyPoints";
    if (req.query.searchByTime === 'weekly') return "$user_points.weeklyPoints";
    if (req.query.searchByTime === 'monthly') return "$user_points.monthlyPoints";
    if (req.query.searchByTime === 'yearly') return "$user_points.yearlyPoints";
};

const sortUsers = (req) => {
    if (req.query.searchByTime === 'daily') return { "user_points.dailyPoints.points": -1 };
    if (req.query.searchByTime === 'weekly') return { "user_points.weeklyPoints.points": -1 };
    if (req.query.searchByTime === 'monthly') return { "user_points.monthlyPoints.points": -1 };
    if (req.query.searchByTime === 'yearly') return { "user_points.yearlyPoints.points": -1 };
};

const updatedSortedUsers = (sortedUsers, searchTime) => {
    for (const user of sortedUsers) {
        const points = user.user_points;
        if (searchTime === 'daily') {
            user.points = points.dailyPoints.points;
            user.games_played = points.dailyPoints.games_played;
        }
        if (searchTime === 'weekly') {
            user.points = points.weeklyPoints.points;
            user.games_played = points.weeklyPoints.games_played;
        }
        if (searchTime === 'monthly') {
            user.points = points.monthlyPoints.points;
            user.games_played = points.monthlyPoints.games_played;
        }
        if (searchTime === 'yearly') {
            user.points = points.yearlyPoints.points;
            user.games_played = points.yearlyPoints.games_played;
        }
        delete user.number;
    }
    return sortedUsers.slice(0, 10);
};

const get_user_current_ranking = async (req, res, next) => {
    try {
        const user = await findUser(req.params.id);
        if (!user) return res.status(404).send({ message: "User not found" });

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
            rank,
            user,
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
                from: "prev_seasons_ranks",
                localField: "prev_seasons_ranks",
                foreignField: "_id",
                as: "prev_seasons_ranks"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "season_results.results.player",
                foreignField: "_id",
                as: "season_results.results.player"
            }
        }
    ])
        .then(sortedUsers => {
            res.status(200).send({ rankedUsers: updatedSortedUsers(sortedUsers, req.query.searchByTime) });
        })
        .catch(next);
};

module.exports = {
    getUserPoints,
    get_user_current_ranking,
    get_rankings
}; 
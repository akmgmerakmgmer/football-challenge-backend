const User = require('../../models/userModel');
const { updateAndGetUser, getUser } = require('../../utilities/user_general_methods.min');
const { numberOfDaysToPlayerLastSaturday, getLastSaturday, getCurrentDay, calculatePercentage } = require('./userUtils.min');
const { addPointsToEvents } = require('./userEvents.min');

const addToResults = async (players, winnerId, results) => {
    if (results.length === 20) results.pop();
    const result = [];
    for (const player of players) {
        const playerData = {
            player: player.userId._id,
            points: player.points,
            isWinner: player.userId._id.toString() === winnerId.toString()
        };
        if (player.isLeft) playerData.points = 0;
        if (player.userId._id.toString() === winnerId.toString() && player.points === 0) playerData.points = 10;
        result.push(playerData);
    }
    return [result, ...results];
};


const updateUserEvent = (userEvents, eventId, points) => {
    const updatedEvents = userEvents.map(event => {
        if (event.id.toString() === eventId.toString()) {
            return { ...event, gamesPlayed: (event.gamesPlayed || 0) + 1, points: points > event.points ? points : event.points };
        }
        return event;
    });
    return updatedEvents;
};
const user_save_game = async (req, res, next) => {
    const { coins, points, usedPerks, eventId } = req.body;
    User.findById({ _id: req.params.id }).then(async user => {
        if (eventId) {
            await addPointsToEvents(user.events, eventId, points, user._id);
            user.events_games_played += 1;
            user.events = updateUserEvent(user.events, eventId, points);
        }
        if (!eventId) {
            const currentDate = new Date();
            const { yearlyPoints, monthlyPoints, weeklyPoints, dailyPoints } = user.user_points;
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;
            // Yearly
            if (yearlyPoints.length && yearlyPoints[yearlyPoints.length - 1].year === currentYear) {
                yearlyPoints[yearlyPoints.length - 1].points += points;
                yearlyPoints[yearlyPoints.length - 1].games_played += 1;
            } else {
                yearlyPoints.push({ points, year: currentYear, games_played: 1 });
            }
            // Monthly
            if (
                monthlyPoints.length &&
                monthlyPoints[monthlyPoints.length - 1].year === currentYear &&
                monthlyPoints[monthlyPoints.length - 1].month === currentMonth
            ) {
                monthlyPoints[monthlyPoints.length - 1].points += points;
                monthlyPoints[monthlyPoints.length - 1].games_played += 1;
            } else {
                monthlyPoints.push({ year: currentYear, month: currentMonth, points, games_played: 1 });
            }
            // Weekly
            if (
                weeklyPoints.length &&
                numberOfDaysToPlayerLastSaturday(weeklyPoints[weeklyPoints.length - 1].weekDate) < 7
            ) {
                weeklyPoints[weeklyPoints.length - 1].points += points;
                weeklyPoints[weeklyPoints.length - 1].games_played += 1;
                weeklyPoints[weeklyPoints.length - 1].weekDate = getLastSaturday(new Date());
            } else {
                weeklyPoints.push({ weekDate: getLastSaturday(new Date()), points, games_played: 1 });
            }
            // Daily
            if (dailyPoints.day === getCurrentDay()) {
                dailyPoints.points += points;
                dailyPoints.games_played += 1;
            } else {
                dailyPoints.points = points;
                dailyPoints.games_played = 1;
                dailyPoints.day = getCurrentDay();
            }
            user.user_points.totalPoints += points;
            user.coins += coins;
            user.games_played += 1;
        }

        if (usedPerks.length) {
            for (const perk of user.perks) {
                if (usedPerks.includes(perk.id.toString())) {
                    perk.quantity -= 1;
                }
            }
        }


        getUser(req.params.id, user, res, next, true);
    }).catch(next);
};

const multi_game_winner = async (req, res, next) => {
    const { userId, players, winnerId, usedPerks } = req.body;
    let prizes = [];
    let promoted = false;
    const user = await User.findById({ _id: userId }).populate('rank');
    user.online_games_played += 1
    user.total_results.wins += 1;
    user.total_results.winning_percentage = calculatePercentage(user.total_results);
    user.season_results.wins += 1;
    user.season_results.winning_percentage = calculatePercentage(user.season_results);
    user.season_results.consecutive_wins += 1;
    user.season_results.consecutive_loses = 0;
    user.season_results.consecutive_rank_loses = 0;
    if (
        user.rank.wins_to_promote > 0 &&
        user.rank.wins_to_promote <= user.season_results.consecutive_rank_wins + 1
    ) {
        user.season_results.consecutive_rank_wins = 0;
        prizes = [...user.rank.prizes];
        user.rank = user.rank.next_rank;
        promoted = true;
        for (const prize of prizes) {
            if (prize.prizeType === 'coins') user.coins += prize.coins;
            if (prize.prizeType === 'avatar') user.avatars.push({ image: prize.avatar, price: 0 });
            if (prize.prizeType === 'theme') user.themes.push(prize.theme);
        }
    } else {
        user.season_results.consecutive_rank_wins += 1;
    }
    if (usedPerks.length) {
        for (const perk of user.perks) {
            if (usedPerks.includes(perk.id.toString())) {
                perk.quantity -= 1;
            }
        }
    }
    user.season_results.results = await addToResults(players, winnerId, user.season_results.results);
    const updatedUser = await updateAndGetUser(userId, user);
    res.status(200).send({ user: updatedUser, prizes, promoted });
};

const multi_game_loser = async (req, res, next) => {
    const { userId, players, winnerId, usedPerks } = req.body;
    let demoted = false;
    const user = await User.findById({ _id: userId }).populate('rank');
    user.online_games_played += 1
    user.total_results.loses += 1;
    user.total_results.winning_percentage = calculatePercentage(user.total_results);
    user.season_results.loses += 1;
    user.season_results.winning_percentage = calculatePercentage(user.season_results);
    user.season_results.consecutive_loses += 1;
    user.season_results.consecutive_wins = 0;
    user.season_results.consecutive_rank_wins = 0;
    if (
        user.rank.loses_to_demote > 0 &&
        user.rank.loses_to_demote <= user.season_results.consecutive_rank_loses + 1
    ) {
        user.rank = user.rank.prev_rank;
        user.season_results.consecutive_rank_loses = 0;
        demoted = true;
    } else {
        user.season_results.consecutive_rank_loses += 1;
    }
    if (usedPerks && usedPerks.length) {
        for (const perk of user.perks) {
            if (usedPerks.includes(perk.id.toString())) {
                perk.quantity -= 1;
            }
        }
    }
    user.season_results.results = await addToResults(players, winnerId, user.season_results.results);
    const updatedUser = await updateAndGetUser(userId, user);
    res.status(200).send({ user: updatedUser, demoted });
};

const multi_game_draw = async (req, res, next) => {
    const { userId, players, winnerId } = req.body;
    const user = await User.findById({ _id: userId }).populate('rank');
    user.online_games_played += 1
    user.total_results.draws += 1;
    user.total_results.winning_percentage = calculatePercentage(user.total_results);
    user.season_results.draws += 1;
    user.season_results.winning_percentage = calculatePercentage(user.season_results);
    user.season_results.consecutive_wins = 0;
    user.season_results.consecutive_loses = 0;
    user.season_results.consecutive_rank_loses = 0;
    user.season_results.consecutive_rank_wins = 0;
    user.season_results.results = await addToResults(players, winnerId, user.season_results.results);
    const updatedUser = await updateAndGetUser(userId, user);
    res.status(200).send({ user: updatedUser });
};

module.exports = {
    user_save_game,
    multi_game_winner,
    multi_game_loser,
    multi_game_draw
}; 
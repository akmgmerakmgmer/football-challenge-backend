const jwt = require('jsonwebtoken');
const User = require('../../models/userModel');
const { getUser, findUser, updateAndGetUser } = require('../../utilities/user_general_methods.min');
const { getCurrentDate } = require('./userUtils.min');

const get_users = (req, res, next) => {
    const page = (req.query.page ? req.query.page - 1 : 0) || 0;
    const per_page = 16;
    const query = {
        $and: [
            { username: { $regex: req.query.username, $options: "i" } },
            { number: { $regex: req.query.number, $options: "i" } }
        ]
    };
    User.find(query).countDocuments()
        .then(total_users => {
            User.find(query)
                .sort({ createdAt: -1 })
                .skip(page * per_page)
                .limit(per_page)
                .then(user => res.status(200).send({ user, total_users, per_page }))
                .catch(next);
        });
};

const checkIfFreeCoinsAvailable = (user) => {
    const currentDate = getCurrentDate();
    if (user?.free_coins && (!user.free_coins.date || user.free_coins.date !== currentDate)) {
        user.free_coins.date = currentDate;
        user.free_coins.numberOfTimes = 0;
    }
    return user;
};

const changeSeason = (user) => {
    if (user && user.current_season !== user.system_info.current_season.title.en) {
        const season_results_defaults = {
            results: [],
            consecutive_rank_wins: 0,
            consecutive_rank_loses: 0,
            winning_percentage: "0%",
            wins: 0,
            loses: 0,
            draws: 0,
            consecutive_wins: 0,
            consecutive_loses: 0
        };
        user.prev_seasons_ranks.push(user.rank._id);
        user.rank = user.rank.season_end_rank;
        user.season_results = season_results_defaults;
        user.current_season = user.system_info.current_season.title.en;
    }
    return user;
};

const changeLoginDayData = (user) => {
    if (user?.login_data?.last_login_day_data) {
        user.login_data.total_logins += 1;
        const currentDate = getCurrentDate();
        const lastLogin = user.login_data.last_login_day_data;
        if (currentDate === lastLogin.day) {
            lastLogin.total_day_logins += 1;
        } else {
            lastLogin.total_day_logins = 1;
            lastLogin.day = currentDate;
        }
    }
    return user;
};

const get_current_user = (req, res, next) => {
    const token = req.body.data.token;
    if (!token) return;
    jwt.verify(token, 'ecommerce secret to help jwt token', async (err, decodedToken) => {
        if (err) return res.sendStatus(401);
        let user = await findUser(decodedToken.id);
        if (!user) return res.sendStatus(404);

        user = changeLoginDayData(user);
        user = checkIfFreeCoinsAvailable(user);
        user = changeSeason(user);

        const prizes = user?.prizes || [];
        for (const prize of prizes) {
            if (prize.prizeType === 'coins') user.coins += prize.coins;
            if (prize.prizeType === 'avatar') user.avatars.push({ image: prize.avatar, price: 0 });
            if (prize.prizeType === 'theme') user.themes.push(prize.theme);
        }
        if (user && user.prizes) user.prizes = [];
        user = await updateAndGetUser(decodedToken.id, user);

        res.status(200).send({ user, prizes });
    });
};

const get_single_user = async (req, res, next) => {
    const user = await findUser(req.params.id);
    if (!user) next();
    res.status(200).send(user);
};

const delete_user = (req, res, next) => {
    User.findByIdAndDelete({ _id: req.params.id })
        .then(user => res.status(200).send(user))
        .catch(next);
};

const update_user = (req, res, next) => {
    if (req.body.username) {
        User.findById({ _id: req.params.id }).then(user => {
            if (user.username === req.body.username) {
                getUser(req.params.id, req.body, res, next);
            } else {
                User.findOne({ username: req.body.username }).then(existingUser => {
                    if (existingUser) {
                        return res.status(422).send({ message: 'username_unique' });
                    } else {
                        getUser(req.params.id, req.body, res, next);
                    }
                });
            }
        });
    } else {
        getUser(req.params.id, req.body, res, next);
    }
};

const add_coins = async (req, res, next) => {
    const user = await User.findById({ _id: req.params.id });
    if (!user) return res.status(400).send({ message: 'user_not_found' });
    const currentDate = getCurrentDate();
    if (user.free_coins.date !== currentDate) {
        user.free_coins.date = currentDate;
        user.free_coins.numberOfTimes = 1;
    } else {
        if (user.free_coins.numberOfTimes >= 3)
            return res.status(400).send({ message: 'maximum_times_reached' });
        user.free_coins.numberOfTimes += 1;
    }
    user.coins += req.body.coins;
    getUser(req.params.id, user, res, next);
};

const notify_about = (req, res, next) => {
    User.findByIdAndUpdate({ _id: req.params.id }, { $push: { notifyAbout: req.body.mode } })
        .then(() => User.findOne({ _id: req.params.id }).then(user => res.status(200).send(user)))
        .catch(next);
};

module.exports = {
    get_users,
    get_current_user,
    get_single_user,
    delete_user,
    update_user,
    add_coins,
    notify_about
}; 
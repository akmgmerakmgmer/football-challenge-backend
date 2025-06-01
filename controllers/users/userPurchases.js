const User = require('../../models/userModel');
const Avatar = require('../../models/avatarsModel');
const Theme = require('../../models/themesModel');
const Perk = require('../../models/perksModel');
const { findUser, getUser } = require('../../utilities/user_general_methods.min');

const buy_avatar = async (req, res, next) => {
    const user = await findUser(req.params.id);
    if (user.avatars.some(a => a.image === req.body.avatar.image))
        return res.status(422).send({ message: { en: "You already have this avatar", ar: "انت بالفعل لديك هذا الرمز" } });
    if (user.coins < req.body.avatar.price)
        return res.status(422).send({ message: { en: "You don't have enough coins", ar: "انت لا تملك عملات كافية" } });
    getUser(req.params.id, { $push: { avatars: req.body.avatar }, $inc: { coins: -req.body.avatar.price } }, res, next, true);
    Avatar.findOneAndUpdate({ image: req.body.avatar.image }, { $inc: { purchases: 1 } }, { new: true });
};

const buy_theme = async (req, res, next) => {
    const user = await findUser(req.params.id);
    if (user.themes.includes(req.body.theme.image))
        return res.status(422).send({ message: { en: "You already have this theme", ar: "انت بالفعل لديك هذه الخلفية" } });
    if (user.coins < req.body.theme.price)
        return res.status(422).send({ message: { en: "You don't have enough coins", ar: "انت لا تملك عملات كافية" } });
    getUser(
        req.params.id,
        {
            $push: { themes: req.body.theme.image },
            $inc: { coins: -req.body.theme.price },
            selectedTheme: req.body.theme.image
        },
        res,
        next,
        true
    );
    Theme.findOneAndUpdate({ image: req.body.theme.image }, { $inc: { purchases: 1 } });
};

const buy_perks = async (req, res, next) => {
    const user = await findUser(req.params.id);
    Perk.findOne({ _id: req.body.perkId }).then(perk => {
        const isPerkWithUser = user.perks.some(item => item.id._id.toString() === perk._id.toString());
        if (user.coins < (perk.price * req.body.quantity))
            return res.status(422).send({ message: { en: "You don't have enough coins", ar: "انت لا تملك عملات كافية" } });
        if (isPerkWithUser) {
            for (const userPerk of user.perks) {
                if (userPerk.id._id.toString() === perk._id.toString()) {
                    userPerk.quantity += req.body.quantity;
                }
            }
        } else {
            user.perks.push({
                id: perk._id,
                quantity: req.body.quantity,
                selected: false
            });
        }
        user.coins -= perk.price * req.body.quantity;
        getUser(req.params.id, user, res, next, true);
    }).catch(next);
};

const select_perk = (req, res, next) => {
    User.findById({ _id: req.params.id }).then(user => {
        user.perks[req.body.index].selected = true;
        getUser(req.params.id, user, res, next);
    }).catch(next);
};

const remove_perk = (req, res, next) => {
    User.findById({ _id: req.params.id }).then(user => {
        user.perks[req.body.index].selected = false;
        getUser(req.params.id, user, res, next);
    }).catch(next);
};

module.exports = {
    buy_avatar,
    buy_theme,
    buy_perks,
    select_perk,
    remove_perk
}; 
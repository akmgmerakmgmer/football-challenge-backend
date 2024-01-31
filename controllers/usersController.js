const jwt = require('jsonwebtoken')
const User = require('../models/userModel')

const get_users = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 16
    User.find({ $and: [{ username: { $regex: req.query.username, $options: "i" } }, { number: { $regex: req.query.number, $options: "i" } }] }).count().then(total_users => {
        User.find({ $and: [{ username: { $regex: req.query.username, $options: "i" } }, { number: { $regex: req.query.number, $options: "i" } }] }).sort({ createdAt: -1 }).skip(page * per_page).limit(per_page).then(user => res.status(200).send({ user, total_users, per_page })).catch(next)
    })
}

const get_current_user = (req, res, next) => {
    const token = req.body.data.token
    if (token) {
        jwt.verify(token, 'ecommerce secret to help jwt token', async (err, decodedToken) => {
            if (err) {
                res.sendStatus(401)
            } else {
                let user = await User.findById(decodedToken.id)
                if (user === null) {
                    res.status(400).send({ message: 'user_not_found' })
                    return;
                }
                res.status(200).send(user)
            }
        })
    }
}

const get_single_user = (req, res, next) => {
    User.findById({ _id: req.params.id }).then(user => res.status(200).send(user)).catch(next)
}

const delete_user = (req, res, next) => {
    User.findByIdAndRemove({ _id: req.params.id }).then(user => {
        res.status(200).send(user)
    }).catch(next)
}

const update_user = (req, res, next) => {
    User.findByIdAndUpdate({ _id: req.params.id }, req.body).then(user => {
        User.findOne({ _id: req.params.id }).then(user => res.status(200).send(user))
    }).catch(next)
}

module.exports = { get_users, get_current_user, get_single_user, delete_user, update_user }
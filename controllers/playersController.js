const Player = require('../models/playersModel')
const { handleErrors } = require('../utilities/handle_errors')

const create_player = async (req, res, next) => {
    if (req.body.playerId) {
        Player.find({ playerId: req.body.playerId }).then(player => {
            if (player.length) {
                Player.findOneAndUpdate({ playerId: req.body.playerId }, req.body).then(player => {
                    Player.findOne({ playerId: req.body.playerId }).then(player => res.status(200).send(player))
                }).catch(next)
            } else {
                Player.create(req.body).then(player => {
                    res.status(200).send(player)
                }).catch(err => {
                    res.status(422).send(handleErrors(err, req, 'player'))
                })
            }
        })
    } else {
        Player.create(req.body).then(player => {
            res.status(200).send(player)
        }).catch(err => {
            res.status(422).send(handleErrors(err, req, 'player'))
        })
    }

}

const get_players = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 16
    Player.find({}).count().then(total_players => {
        Player.find({}).sort({ createdAt: -1 }).skip(page * per_page).limit(per_page).then(player => res.status(200).send({ player, total_players, per_page })).catch(next)
    })
}

const get_single_player = (req, res, next) => {
    Player.findById({ _id: req.params.id }).then(player => res.status(200).send(player)).catch(next)
}

const delete_player = (req, res, next) => {
    Player.findByIdAndRemove({ _id: req.params.id }).then(player => {
        res.status(200).send(player)
    }).catch(next)
}

const update_player = (req, res, next) => {
    Player.findByIdAndUpdate({ _id: req.params.id }, req.body).then(player => {
        Player.findOne({ _id: req.params.id }).then(player => res.status(200).send(player))
    }).catch(next)
}

module.exports = { create_player, get_players, get_single_player, delete_player, update_player }
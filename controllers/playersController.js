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

const modify_english_name = (req, res, next) => {
    Player.find({}).then(players => {
        for (let i in players) {
            const nameEnglishSplit = players[i].nameEn.split(' ')
            if (nameEnglishSplit.length > 1 && nameEnglishSplit[0].endsWith('.')) {
                players[i].nameEn = `${players[i].firstName} ${nameEnglishSplit[1]}`
            }
            Player.findByIdAndUpdate({ _id: players[i]._id }, players[i]).then(res => {

            })
        }
    })
}

const add_fullname = (req, res, next) => {
    Player.find({}).then(players => {
        for (let i in players) {
            const firstPartOfFirstName = players[i].firstName.split(' ')[0]
            const secondPartOfFirstName = players[i].firstName.split(' ')[1]
            const secondPartOfName = players[i].nameEn.split(' ')[1] || ''
            const fullName = secondPartOfFirstName == secondPartOfName ? `${firstPartOfFirstName} ${secondPartOfName}` : `${players[i].firstName} ${secondPartOfName}`
            players[i].fullName = fullName
            console.log(players[i].fullName)
            Player.findByIdAndUpdate({ _id: players[i]._id }, players[i]).then(res => {

            })
        }
    })
}

const get_players = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 16
    Player.find({ $or: [{ firstName: { $regex: req.query.name, $options: "i" } }, { nameEn: { $regex: req.query.name, $options: "i" } }, { nameAr: { $regex: req.query.name, $options: "i" } }, { fullName: { $regex: req.query.name, $options: "i" } }] }).count().then(total_players => {
        Player.find({ $or: [{ firstName: { $regex: req.query.name, $options: "i" } }, { nameEn: { $regex: req.query.name, $options: "i" } }, { nameAr: { $regex: req.query.name, $options: "i" }, }, { fullName: { $regex: req.query.name, $options: "i" } }] }).sort({ createdAt: -1 }).skip(page * per_page).limit(per_page).then(player => res.status(200).send({ player, total_players, per_page })).catch(next)
    })
}

const get_single_player = (req, res, next) => {
    Player.findById({ _id: req.params.id }).then(player => res.status(200).send(player)).catch(next)
}

const delete_player = (req, res, next) => {
    Player.findByIdAndDelete({ _id: req.params.id }).then(player => {
        res.status(200).send(player)
    }).catch(next)
}

const update_player = (req, res, next) => {
    Player.findByIdAndUpdate({ _id: req.params.id }, req.body).then(player => {
        Player.findOne({ _id: req.params.id }).then(player => res.status(200).send(player))
    }).catch(next)
}

module.exports = { create_player, get_players, get_single_player, delete_player, update_player }
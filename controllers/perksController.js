const Perk = require("../models/perksModel")
const { handleErrors } = require('../utilities/handle_errors')

const create_perk = (req, res, next) => {
    Perk.create(req.body).then(perk => {
        res.status(200).send(perk)
    }).catch(err => {
        res.status(422).send(handleErrors(err, req, 'perk'))
    })
}

const get_perks = (req, res, next) => {
    Perk.find({}).then(perks => {
        res.status(200).send({ perks })
    }).catch(next)

}

const get_admin_perks = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 30
    Perk.find({}).count().then(total_perks => {
        Perk.find({}).skip(page * per_page).limit(per_page).then(perks => res.status(200).send({ perks, total_perks, per_page })).catch(next)
    })
}

const get_single_perk = (req, res, next) => {
    Perk.findById({ _id: req.params.id }).then(perk => res.status(200).send(perk)).catch(next)
}

const update_perk = (req, res, next) => {
    Perk.findByIdAndUpdate({ _id: req.params.id }, req.body).then(perk => {
        Perk.findOne({ _id: req.params.id }).then(perk => res.status(200).send(perk))
    }).catch(next)
}

const delete_perk = (req, res, next) => {
    Perk.findByIdAndDelete({ _id: req.params.id }).then(perk => {
        res.status(200).send(perk)
    }).catch(next)
}


module.exports = { create_perk, update_perk, get_single_perk, get_admin_perks, get_perks, delete_perk }
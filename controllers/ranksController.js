const Rank = require("../models/rankModel")
const { handleErrors } = require('../utilities/handle_errors')

const create_rank = (req, res, next) => {
    Rank.create(req.body).then(rank => res.status(200).send(rank)).catch(err => res.status(422).send(handleErrors(err, req, 'rank')))
}

const get_ranks = (req, res, next) => {
    Rank.find({}).lean().then(ranks => res.status(200).send({ ranks })).catch(next)

}

const get_admin_ranks = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 30
    Rank.find({}).count().then(total_ranks => {
        Rank.find({}).skip(page * per_page).limit(per_page).then(ranks => res.status(200).send({ ranks, total_ranks, per_page })).catch(next)
    })
}

const get_single_rank = (req, res, next) => {
    Rank.findById({ _id: req.params.id }).then(rank => res.status(200).send(rank)).catch(next)
}

const update_rank = (req, res, next) => {
    Rank.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true }).then(rank => res.status(200).send(rank)).catch(next)
}

const delete_rank = (req, res, next) => {
    Rank.findByIdAndDelete({ _id: req.params.id }, { new: true }).then(rank => res.status(200).send(rank)).catch(next)
}


module.exports = { create_rank, update_rank, get_single_rank, get_admin_ranks, get_ranks, delete_rank }
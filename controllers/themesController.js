const Theme = require("../models/themesModel")
const { handleErrors } = require('../utilities/handle_errors')

const create_theme = (req, res, next) => {
    Theme.create(req.body).then(theme => {
        res.status(200).send(theme)
    }).catch(err => {
        res.status(422).send(handleErrors(err, req, 'theme'))
    })
}

const get_themes = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 8
    Theme.find({}).count().then(total_themes => {
        Theme.find({}).sort({ createdAt: -1 }).skip(page * per_page).limit(per_page).then(themes => res.status(200).send({ themes, total_themes, per_page })).catch(next)
    })
}

const get_admin_themes = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 30
    Theme.find({}).count().then(total_themes => {
        Theme.find({}).skip(page * per_page).limit(per_page).then(themes => res.status(200).send({ themes, total_themes, per_page })).catch(next)
    })
}

const get_single_theme = (req, res, next) => {
    Theme.findById({ _id: req.params.id }).then(theme => res.status(200).send(theme)).catch(next)
}

const update_theme = (req, res, next) => {
    Theme.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true }).then(theme => res.status(200).send(theme)).catch(next)
}

const delete_theme = (req, res, next) => {
    Theme.findByIdAndDelete({ _id: req.params.id }).then(theme => res.status(200).send(theme)).catch(next)
}


module.exports = { create_theme, update_theme, get_single_theme, get_admin_themes, get_themes, delete_theme }
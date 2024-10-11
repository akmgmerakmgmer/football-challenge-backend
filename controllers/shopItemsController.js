const Perk = require("../models/perksModel")
const ShopItem = require("../models/shopItemModel")
const { handleErrors } = require('../utilities/handle_errors')

const create_shopItem = (req, res, next) => {
    ShopItem.create(req.body).then(shopItem => {
        res.status(200).send(shopItem)
    }).catch(err => {
        res.status(422).send(handleErrors(err, req, 'shopItem'))
    })
}

const get_shopItems = async (req, res, next) => {
    const perksItems = await Perk.find({}).populate('title').populate('description')
    ShopItem.find({}).populate('title').then(shopItems => {
        const perks = perksItems
        const coins = shopItems.filter(item => item.itemType === 'coins')
        const bundles = shopItems.filter(item => item.itemType === 'bundles')
        res.status(200).send({ perks, coins, bundles })
    }).catch(next)
}

const get_admin_shopItems = (req, res, next) => {
    const page = req.query.page - 1 || 0
    const per_page = 30
    ShopItem.find({}).count().then(total_shopItems => {
        ShopItem.find({}).skip(page * per_page).limit(per_page).then(shopItems => res.status(200).send({ shopItems, total_shopItems, per_page })).catch(next)
    })
}

const get_single_shopItem = (req, res, next) => {
    ShopItem.findById({ _id: req.params.id }).then(shopItem => res.status(200).send(shopItem)).catch(next)
}

const update_shopItem = (req, res, next) => {
    ShopItem.findByIdAndUpdate({ _id: req.params.id }, req.body).then(shopItem => {
        ShopItem.findOne({ _id: req.params.id }).then(shopItem => res.status(200).send(shopItem))
    }).catch(next)
}

const delete_shopItem = (req, res, next) => {
    ShopItem.findByIdAndDelete({ _id: req.params.id }).then(shopItem => {
        res.status(200).send(shopItem)
    }).catch(next)
}


module.exports = { create_shopItem, update_shopItem, get_single_shopItem, get_admin_shopItems, get_shopItems, delete_shopItem }
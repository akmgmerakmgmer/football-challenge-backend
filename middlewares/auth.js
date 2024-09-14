const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const requireAuth = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) return res.sendStatus(401)
    jwt.verify(token, 'ecommerce secret to help jwt token', async (err, decodedToken) => {
        if (err) {
            return res.sendStatus(403)
        } else {
            let user = await User.findById(decodedToken.id)
            if (user) {
                next()
                return;
            } else {
                res.sendStatus(401)
            }
        }
    })
}

const onlyAdminAuth = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) return res.sendStatus(401)
    jwt.verify(token, 'ecommerce secret to help jwt token', async (err, decodedToken) => {
        if (err) {
            return res.sendStatus(403)
        } else {
            let user = await User.findById(decodedToken.id)
            if (user && (user.roles.includes('admin') || user.roles.includes('developer'))) {
                next()
                return;
            } else {
                res.sendStatus(401)
            }
        }
    })
}

const onlyUserAuth = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) return res.sendStatus(401)
    jwt.verify(token, 'ecommerce secret to help jwt token', async (err, decodedToken) => {
        if (err) {
            return res.sendStatus(403)
        } else {
            let user = await User.findById(decodedToken.id)
            if (user && user._id.toString() == req.params.id) {
                next()
                return;
            } else {
                res.sendStatus(401)
            }
        }
    })
}


module.exports = { requireAuth, onlyAdminAuth, onlyUserAuth }
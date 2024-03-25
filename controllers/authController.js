const User = require('../models/userModel')
const jwt = require('jsonwebtoken')


const handleErrors = (err, req) => {
    let errors = { username: '', password: '', number: '' }
    if (err.message.includes('E11000 duplicate key')) {
        errors.username = 'username_unique'
    }
    if (err.message.includes('user validation failed')) {
        Object.values(err.errors).forEach(error => {
            errors[error.properties.path] = error.properties.message
        })
    }
    if (err.message === 'incorrect username') {
        errors.username = 'username_not_correct'
    }
    if (err.message === 'incorrect password') {
        errors.password = 'password_not_correct'
    }
    return errors
}

const createToken = (id) => {
    return jwt.sign({ id }, 'ecommerce secret to help jwt token', { expiresIn: 1 * 24 * 60 * 60 * 100000 })
}


const signup_post = async (req, res, next) => {
    try {
        const user = await User.create(req.body);
        const token = createToken(user._id)
        return res.status(201).send({ accessToken: token });
    } catch (err) {
        return res.status(422).send(handleErrors(err, req));
    }
};
const login_post = async (req, res) => {
    try {
        const user = await User.login(req.body.username.trim(), req.body.password)
        const token = createToken(user._id)
        res.cookie('token', token, { httpOnly: true, maxAge: 1 * 24 * 60 * 60 * 100000 })
        res.status(200).send({ accessToken: token })
    } catch (err) {
        res.status(422).send(handleErrors(err, req))
    }

}

module.exports = { signup_post, login_post }
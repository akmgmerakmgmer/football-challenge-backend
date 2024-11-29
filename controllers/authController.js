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

function generateRandomUsername() {
    const adjectives = ["dsadasasaaasaaa", "sdssasa", "aaas", "sasa", "waas", "asads", "asads", "dsadassaaasaaaa", "sdsasa", "aaa", "assa", "wsaa", "aass", "adds",];
    const nouns = ["dsaddsaa", "Tiagaderdsa", "Eaglssdedsada", "Sharsaasadk", "dsadsaaas", "adasdaaas", "sdaasdaaadwa", "dsadaaa", "Tigaaader", "Eaglsedsdaa", "Shaasrsadk", "dsaadaas", "adaasaadas", "sdasaadaadwa"];

    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 10000000000000000); // Random number between 0-999

    return `${randomAdjective}${randomNoun}${randomNumber}`;
}
const seed_users = async (req, res, next) => {
    for (let i = 0; i < 20000; i++) {
        req.body.username = generateRandomUsername()
        console.log(req.body.username)
        await User.create(req.body);
    }
    res.sendStatus(200)
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
const email_login = async (req, res, next) => {
    const payload = {
        email: req.body.email,
        number: '01119683676',
        username: req.body.email
    }
    console.log(payload)
    const user = await User.findOne({ email: req.body.email })
    if (user) {
        res.status(200).send(user)
    } else {
        User.create(payload).populate('perks.id').then(newUser => {
            res.status(201).send(newUser)
        })
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

module.exports = { signup_post, login_post, email_login }
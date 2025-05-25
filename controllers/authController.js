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
    const adjectives = ["tiger", "cat", "dog", "zebra", "lion", "tiger", "spider", "crocodile", "fish", "shark", "whale", "bird", "eagle", "bear", "wolf", "fox", "rabbit", "deer", "elephant", "giraffe", "hippo", "panda", "koala", "kangaroo", "monkey", "gorilla", "chimpanzee", "orangutan", "sloth"];
    const nouns = ["adventure", "explorer", "traveler", "wanderer", "seeker", "dreamer", "visionary", "pioneer", "innovator", "creator", "artist", "scientist", "engineer", "architect", "writer", "poet", "musician", "singer", "dancer", "athlete", "champion", "hero", "legend", "myth", "fantasy"];

    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 1000000000); // Random number between 0-999

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
        number: req.body.phoneNumber || '01119683676',
        username: req.body.email.split('@')[0] || generateRandomUsername(),
        password: 'dummyPassword193548',
        birthdate: req.body.birthdate
    }
    const user = await User.findOne({ email: req.body.email })
    if (user) {
        const token = createToken(user._id)
        res.status(200).send({ 'accessToken': token })
    } else {
        User.create(payload).then(newUser => {
            const token = createToken(newUser._id)
            res.status(200).send({ 'accessToken': token })
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
const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController.js')
const usersController = require('../controllers/usersController.js')
const questionsController = require('../controllers/questionsController.js')
const playersController = require('../controllers/playersController.js')
const translate = require('translate-google')


//Auth Routes
router.post('/signup', authController.signup_post)
router.post('/login', authController.login_post)

//User Routes
router.get('/users', usersController.get_users)
router.post('/current-user', usersController.get_current_user)
router.get('/users/:id', usersController.get_single_user)
router.delete('/users/:id', usersController.delete_user)
router.put('/users/:id', usersController.update_user)

//Question Routes
router.post('/questions', questionsController.create_questions)
router.get('/questions', questionsController.get_questions)
router.get('/admin-questions', questionsController.get_admin_questions)
router.get('/questions/:id', questionsController.get_single_question)
router.delete('/questions/:id', questionsController.delete_question)
router.put('/questions/:id', questionsController.update_question)

//Player Routes
router.post('/players', playersController.create_player)
router.get('/players', playersController.get_players)
router.get('/players/:id', playersController.get_single_player)
router.delete('/players/:id', playersController.delete_player)
router.put('/players/:id', playersController.update_player)

router.post('/translate', (req, res, next) => {
    translate(req.body.msg, { from: 'en', to: 'ar' }).then(response => {
        res.status(200).send(response);
    }).catch(err => {
        console.error(err)
    })
})

module.exports = router
const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController.min.js')
const usersController = require('../controllers/usersController.min.js')
const questionsController = require('../controllers/questionsController.min.js')
const playersController = require('../controllers/playersController.min.js')
const advertismentController = require('../controllers/advertismentController.min.js')
const cloudinary = require('../utilities/cloudinary')
require("dotenv").config()
const upload = require('../utilities/multer')
const tinify = require('tinify');
tinify.key = process.env.TINIFY_KEY;
const translate = require('translate-google')
const cache = require('../route_cache.js')

//Auth Routes
router.post('/signup', authController.signup_post)
router.post('/login', authController.login_post)

//User Routes
router.get('/users', usersController.get_users)
router.post('/current-user', usersController.get_current_user)
router.get('/users/:id', usersController.get_single_user)
router.delete('/users/:id', usersController.delete_user)
router.put('/users/:id', usersController.update_user)
router.post('/user-save-game/:id', usersController.user_save_game)
router.get('/get-user-rank/:id', usersController.get_user_current_ranking)
router.get('/get-rankings', usersController.get_rankings)
router.put('/buy-avatar/:id', usersController.buy_avatar)
router.put('/notify-about/:id', usersController.notify_about)

//Question Routes
router.post('/questions', questionsController.create_questions)
router.get('/questions', cache(300), questionsController.get_questions)
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

//Advertisment Routes
router.post('/advertisments', advertismentController.create_advertisment)
router.get('/advertisments', cache(300), advertismentController.get_advertisment)
router.get('/advertisments/:id', advertismentController.get_single_advertisment)
router.delete('/advertisments/:id', advertismentController.delete_advertisment)
router.put('/advertisments/:id', advertismentController.update_advertisment)
router.put('/ad-clicked/:id', advertismentController.ad_clicked)

router.post('/translate', (req, res, next) => {
    translate(req.body.msg, { from: req.body.from, to: req.body.to }).then(response => {
        res.status(200).send(response);
    }).catch(next)
})

const compressImage = function (req, res, next) {
    const source = tinify.fromFile(req.file.path);
    source.toFile(req.file.path, function () {
        next();
    });
};
router.post('/upload-single', upload.single('image'), compressImage, async (req, res) => {
    if (!req.file) {
        res.send({ code: 422, msg: 'field_required' })
    } else {
        const result = await cloudinary.uploader.upload(req.file.path)
        res.status(200).send(result)
    }
})
module.exports = router
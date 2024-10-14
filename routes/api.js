const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController.min.js')
const usersController = require('../controllers/usersController.min.js')
const questionsController = require('../controllers/questionsController.min.js')
const playersController = require('../controllers/playersController.min.js')
const advertismentController = require('../controllers/advertismentController.min.js')
const challengeController = require('../controllers/challengesController.min.js')
const avatarController = require('../controllers/avatarsController.min.js')
const transactionController = require('../controllers/transactionController.min.js')
const shopItemsController = require('../controllers/shopItemsController.min.js')
const perksController = require('../controllers/perksController.min.js')
const { onlyAdminAuth, onlyUserAuth, requireAuth } = require('../middlewares/auth.min.js')
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
router.get('/users', onlyAdminAuth, usersController.get_users)
router.post('/current-user', usersController.get_current_user)
router.get('/users/:id', requireAuth, usersController.get_single_user)
router.delete('/users/:id', onlyAdminAuth, usersController.delete_user)
router.put('/users/:id', requireAuth, usersController.update_user)
router.put('/remove-perk/:id', onlyUserAuth, usersController.remove_perk)
router.put('/select-perk/:id', onlyUserAuth, usersController.select_perk)
router.put('/add-coins/:id', requireAuth, usersController.add_coins)
router.post('/user-save-game/:id', onlyUserAuth, usersController.user_save_game)
router.get('/get-user-rank/:id', onlyUserAuth, usersController.get_user_current_ranking)
router.get('/get-rankings', usersController.get_rankings)
router.put('/buy-avatar/:id', onlyUserAuth, usersController.buy_avatar)
router.put('/buy-perks/:id', onlyUserAuth, usersController.buy_perks)
router.put('/notify-about/:id', onlyUserAuth, usersController.notify_about)

//Question Routes
router.post('/questions', onlyAdminAuth, questionsController.create_questions)
router.get('/questions', requireAuth, questionsController.get_questions)
router.get('/admin-questions', onlyAdminAuth, questionsController.get_admin_questions)
router.get('/questions/:id', onlyAdminAuth, questionsController.get_single_question)
router.delete('/questions/:id', onlyAdminAuth, questionsController.delete_question)
router.put('/questions/:id', onlyAdminAuth, questionsController.update_question)

//Player Routes
router.post('/players', onlyAdminAuth, playersController.create_player)
router.get('/players', requireAuth, playersController.get_players)
router.get('/players/:id', onlyAdminAuth, playersController.get_single_player)
router.delete('/players/:id', onlyAdminAuth, playersController.delete_player)
router.put('/players/:id', onlyAdminAuth, playersController.update_player)

//Advertisment Routes
router.post('/advertisments', onlyAdminAuth, advertismentController.create_advertisment)
router.get('/advertisments', cache(5 * 60), advertismentController.get_advertisment)
router.get('/admin-advertisments', onlyAdminAuth, advertismentController.get_admin_advertisments)
router.get('/advertisments/:id', onlyAdminAuth, advertismentController.get_single_advertisment)
router.delete('/advertisments/:id', onlyAdminAuth, advertismentController.delete_advertisment)
router.put('/advertisments/:id', onlyAdminAuth, advertismentController.update_advertisment)
router.put('/ad-clicked/:id', advertismentController.ad_clicked)

// Challenges
router.post('/challenges', onlyAdminAuth, challengeController.create_challenge)
router.get('/challenges', challengeController.get_challenges)
router.get('/admin-challenges', onlyAdminAuth, challengeController.get_admin_challenges)
router.get('/challenges/:id', onlyAdminAuth, challengeController.get_single_challenge)
router.delete('/challenges/:id', onlyAdminAuth, challengeController.delete_challenge)
router.put('/challenges/:id', onlyAdminAuth, challengeController.update_challenge)

// Avatars
router.post('/avatars', onlyAdminAuth, avatarController.create_avatar)
router.get('/avatars', cache(5 * 60), avatarController.get_avatars)
router.get('/admin-avatars', onlyAdminAuth, avatarController.get_admin_avatars)
router.get('/avatars/:id', onlyAdminAuth, avatarController.get_single_avatar)
router.delete('/avatars/:id', onlyAdminAuth, avatarController.delete_avatar)
router.put('/avatars/:id', onlyAdminAuth, avatarController.update_avatar)

// Transactions
router.post('/card-payment', transactionController.kashierPaymentMethod)
router.post('/payment-success', transactionController.payment_success)
router.get('/transactions', onlyAdminAuth, transactionController.get_transactions)
router.get('/transactions/:id', onlyAdminAuth, transactionController.get_single_transaction)
router.delete('/transactions/:id', onlyAdminAuth, transactionController.delete_transaction)
router.put('/transactions/:id', onlyAdminAuth, transactionController.update_transaction)

// Perks
router.post('/perks', onlyAdminAuth, perksController.create_perk)
router.get('/perks', cache(5 * 60), perksController.get_perks)
router.get('/admin-perks', onlyAdminAuth, perksController.get_admin_perks)
router.get('/perks/:id', onlyAdminAuth, perksController.get_single_perk)
router.delete('/perks/:id', onlyAdminAuth, perksController.delete_perk)
router.put('/perks/:id', onlyAdminAuth, perksController.update_perk)

// ShopItems
router.post('/shopItems', onlyAdminAuth, shopItemsController.create_shopItem)
router.get('/shopItems', shopItemsController.get_shopItems)
router.get('/admin-shopItems', onlyAdminAuth, shopItemsController.get_admin_shopItems)
router.get('/shopItems/:id', onlyAdminAuth, shopItemsController.get_single_shopItem)
router.delete('/shopItems/:id', onlyAdminAuth, shopItemsController.delete_shopItem)
router.put('/shopItems/:id', onlyAdminAuth, shopItemsController.update_shopItem)


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

router.post('/upload-video', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(422).send({ code: 422, msg: 'field_required' });
    }
    try {
        const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'video' });
        res.status(200).send(result);
    } catch (err) {
        res.status(500).send({ code: 500, msg: 'upload_error', error: err.message });
    }
});
module.exports = router
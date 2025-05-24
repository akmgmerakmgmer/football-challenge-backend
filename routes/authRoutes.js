const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.min.js');

router.post('/signup', authController.signup_post);
router.post('/email-login', authController.email_login);
router.post('/login', authController.login_post);

module.exports = router; 
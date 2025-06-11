const express = require('express')
const router = express.Router()
require("dotenv").config()


// Import routers
const authRoutes = require('./authRoutes.min');
const userRoutes = require('./userRoutes.min');
const questionRoutes = require('./questionRoutes.min');
const playerRoutes = require('./playerRoutes.min');
const advertisementRoutes = require('./advertisementRoutes.min');
const challengeRoutes = require('./challengeRoutes.min');
const avatarRoutes = require('./avatarRoutes.min');
const themeRoutes = require('./themeRoutes.min');
const transactionRoutes = require('./transactionRoutes.min');
const shopItemRoutes = require('./shopItemRoutes.min');
const perkRoutes = require('./perkRoutes.min');
const rankRoutes = require('./rankRoutes.min');
const eventRoutes = require('./eventRoutes.min');
const systemRoutes = require('./systemRoutes.min');
const utilityRoutes = require('./utilityRoutes.min');
const uploadRoutes = require('./uploadRoutes.min');

// Use routers
router.use('/', authRoutes);
router.use('/', userRoutes);
router.use('/', questionRoutes);
router.use('/', playerRoutes);
router.use('/', advertisementRoutes);
router.use('/', challengeRoutes);
router.use('/', avatarRoutes);
router.use('/', themeRoutes);
router.use('/', transactionRoutes);
router.use('/', shopItemRoutes);
router.use('/', perkRoutes);
router.use('/', rankRoutes);
router.use('/', eventRoutes);
router.use('/', systemRoutes);
router.use('/', uploadRoutes);
router.use('/', utilityRoutes);


module.exports = router
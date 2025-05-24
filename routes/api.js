const express = require('express')
const router = express.Router()
require("dotenv").config()


// Import routers
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const questionRoutes = require('./questionRoutes');
const playerRoutes = require('./playerRoutes');
const advertisementRoutes = require('./advertisementRoutes');
const challengeRoutes = require('./challengeRoutes');
const avatarRoutes = require('./avatarRoutes');
const themeRoutes = require('./themeRoutes');
const transactionRoutes = require('./transactionRoutes');
const shopItemRoutes = require('./shopItemRoutes');
const perkRoutes = require('./perkRoutes');
const rankRoutes = require('./rankRoutes');
const eventRoutes = require('./eventRoutes');
const systemRoutes = require('./systemRoutes');
const utilityRoutes = require('./utilityRoutes');
const uploadRoutes = require('./uploadRoutes');

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
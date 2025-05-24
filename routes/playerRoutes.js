const express = require('express');
const router = express.Router();
const playersController = require('../controllers/playersController.min.js');
const { onlyAdminAuth, requireAuth } = require('../middlewares/auth.min.js');
const cache = require('../route_cache.js');
const ONE_HOUR = 60 * 60;

router.post('/players', onlyAdminAuth, playersController.create_player);
router.get('/players', requireAuth, cache(ONE_HOUR), playersController.get_players);
router.get('/players/:id', onlyAdminAuth, playersController.get_single_player);
router.delete('/players/:id', onlyAdminAuth, playersController.delete_player);
router.put('/players/:id', onlyAdminAuth, playersController.update_player);

module.exports = router; 
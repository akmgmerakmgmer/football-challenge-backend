const express = require('express');
const router = express.Router();
const ranksController = require('../controllers/ranksController.min.js');
const { onlyAdminAuth } = require('../middlewares/auth.min.js');
const cache = require('../route_cache.js');
const TWELVE_HOURS = 60 * 60 * 12;

router.post('/ranks', onlyAdminAuth, ranksController.create_rank);
router.get('/ranks', cache(TWELVE_HOURS), ranksController.get_ranks);
router.get('/admin-ranks', onlyAdminAuth, ranksController.get_admin_ranks);
router.get('/ranks/:id', onlyAdminAuth, ranksController.get_single_rank);
router.delete('/ranks/:id', onlyAdminAuth, ranksController.delete_rank);
router.put('/ranks/:id', onlyAdminAuth, ranksController.update_rank);

module.exports = router; 
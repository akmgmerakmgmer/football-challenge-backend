const express = require('express');
const router = express.Router();
const perksController = require('../controllers/perksController.min.js');
const { onlyAdminAuth } = require('../middlewares/auth.min.js');
const cache = require('../route_cache.js');
const FIVE_HOURS = 60 * 60 * 5;

router.post('/perks', onlyAdminAuth, perksController.create_perk);
router.get('/perks', cache(FIVE_HOURS), perksController.get_perks);
router.get('/admin-perks', onlyAdminAuth, perksController.get_admin_perks);
router.get('/perks/:id', onlyAdminAuth, perksController.get_single_perk);
router.delete('/perks/:id', onlyAdminAuth, perksController.delete_perk);
router.put('/perks/:id', onlyAdminAuth, perksController.update_perk);

module.exports = router; 
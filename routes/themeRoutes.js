const express = require('express');
const router = express.Router();
const themeController = require('../controllers/themesController.min.js');
const { onlyAdminAuth } = require('../middlewares/auth.min.js');
const cache = require('../route_cache.js');
const FIVE_HOURS = 60 * 60 * 5;

router.post('/themes', onlyAdminAuth, themeController.create_theme);
router.get('/themes', cache(FIVE_HOURS), themeController.get_themes);
router.get('/admin-themes', onlyAdminAuth, themeController.get_admin_themes);
router.get('/themes/:id', onlyAdminAuth, themeController.get_single_theme);
router.delete('/themes/:id', onlyAdminAuth, themeController.delete_theme);
router.put('/themes/:id', onlyAdminAuth, themeController.update_theme);

module.exports = router; 
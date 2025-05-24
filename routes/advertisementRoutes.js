const express = require('express');
const router = express.Router();
const advertismentController = require('../controllers/advertismentController.min.js');
const { onlyAdminAuth } = require('../middlewares/auth.min.js');
const cache = require('../route_cache.js');
const TWELVE_HOURS = 60 * 60 * 12;

router.post('/advertisments', onlyAdminAuth, advertismentController.create_advertisment);
router.get('/advertisments', cache(TWELVE_HOURS), advertismentController.get_advertisment);
router.get('/admin-advertisments', onlyAdminAuth, advertismentController.get_admin_advertisments);
router.get('/advertisments/:id', onlyAdminAuth, advertismentController.get_single_advertisment);
router.delete('/advertisments/:id', onlyAdminAuth, advertismentController.delete_advertisment);
router.put('/advertisments/:id', onlyAdminAuth, advertismentController.update_advertisment);
router.put('/ad-clicked/:id', advertismentController.ad_clicked);

module.exports = router; 
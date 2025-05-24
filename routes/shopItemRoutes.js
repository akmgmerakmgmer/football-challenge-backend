const express = require('express');
const router = express.Router();
const shopItemsController = require('../controllers/shopItemsController.min.js');
const { onlyAdminAuth } = require('../middlewares/auth.min.js');
const cache = require('../route_cache.js');
const FIVE_HOURS = 60 * 60 * 5;

router.post('/shopItems', onlyAdminAuth, shopItemsController.create_shopItem);
router.get('/shopItems', cache(FIVE_HOURS), shopItemsController.get_shopItems);
router.get('/admin-shopItems', onlyAdminAuth, shopItemsController.get_admin_shopItems);
router.get('/shopItems/:id', onlyAdminAuth, shopItemsController.get_single_shopItem);
router.delete('/shopItems/:id', onlyAdminAuth, shopItemsController.delete_shopItem);
router.put('/shopItems/:id', onlyAdminAuth, shopItemsController.update_shopItem);

module.exports = router; 
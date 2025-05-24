const express = require('express');
const router = express.Router();
const avatarController = require('../controllers/avatarsController.min.js');
const { onlyAdminAuth } = require('../middlewares/auth.min.js');
const cache = require('../route_cache.js');
const FIVE_HOURS = 60 * 60 * 5;

router.post('/avatars', onlyAdminAuth, avatarController.create_avatar);
router.get('/avatars', cache(FIVE_HOURS), avatarController.get_avatars);
router.get('/admin-avatars', onlyAdminAuth, avatarController.get_admin_avatars);
router.get('/avatars/:id', onlyAdminAuth, avatarController.get_single_avatar);
router.delete('/avatars/:id', onlyAdminAuth, avatarController.delete_avatar);
router.put('/avatars/:id', onlyAdminAuth, avatarController.update_avatar);

module.exports = router; 
const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengesController.min.js');
const { onlyAdminAuth } = require('../middlewares/auth.min.js');
const cache = require('../route_cache.js');
const TWELVE_HOURS = 60 * 60 * 12;

router.post('/challenges', onlyAdminAuth, challengeController.create_challenge);
router.get('/challenges', cache(TWELVE_HOURS), challengeController.get_challenges);
router.get('/admin-challenges', onlyAdminAuth, challengeController.get_admin_challenges);
router.get('/challenges/:id', onlyAdminAuth, challengeController.get_single_challenge);
router.delete('/challenges/:id', onlyAdminAuth, challengeController.delete_challenge);
router.put('/challenges/:id', onlyAdminAuth, challengeController.update_challenge);

module.exports = router; 
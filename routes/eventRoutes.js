const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController.min.js');
const { onlyAdminAuth, requireAuth } = require('../middlewares/auth.min.js');
const cache = require('../route_cache.js');
const TWELVE_HOURS = 60 * 60 * 12;

router.post('/events', onlyAdminAuth, eventsController.create_events);
router.get('/events', cache(TWELVE_HOURS), eventsController.get_events);
router.get('/admin-events', onlyAdminAuth, eventsController.get_admin_events);
router.get('/events/:id', requireAuth, eventsController.get_single_events);
router.delete('/events/:id', onlyAdminAuth, eventsController.delete_events);
router.put('/events/:id', onlyAdminAuth, eventsController.update_events);

module.exports = router; 
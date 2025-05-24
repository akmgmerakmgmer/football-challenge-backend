const express = require('express');
const router = express.Router();
const questionsController = require('../controllers/questionsController.min.js');
const { onlyAdminAuth, requireAuth } = require('../middlewares/auth.min.js');
const cache = require('../route_cache.js');
const ONE_MINUTE = 60;

router.post('/questions', questionsController.create_questions);
router.get('/questions', requireAuth, cache(ONE_MINUTE), questionsController.get_questions);
router.get('/admin-questions', onlyAdminAuth, questionsController.get_admin_questions);
router.get('/questions/:id', onlyAdminAuth, questionsController.get_single_question);
router.delete('/questions/:id', onlyAdminAuth, questionsController.delete_question);
router.put('/questions/:id', onlyAdminAuth, questionsController.update_question);
router.get('/dynamic-question-method', questionsController.deleteFromObject);

module.exports = router; 
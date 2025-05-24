const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController.min.js');
const { onlyAdminAuth } = require('../middlewares/auth.min.js');

router.post('/card-payment', transactionController.kashierPaymentMethod);
router.post('/payment-success', transactionController.payment_success);
router.get('/transactions', onlyAdminAuth, transactionController.get_transactions);
router.get('/transactions/:id', onlyAdminAuth, transactionController.get_single_transaction);
router.delete('/transactions/:id', onlyAdminAuth, transactionController.delete_transaction);
router.put('/transactions/:id', onlyAdminAuth, transactionController.update_transaction);

module.exports = router; 
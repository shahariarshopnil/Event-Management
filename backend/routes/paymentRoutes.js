const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  initPayment,
  paymentSuccess,
  paymentFailed,
  paymentCancelled,
  getPaymentHistory,
  getPaymentDetails,
  validateTransaction,
  ipnHandler,
  initiateRefund,
  checkRefundStatus,
  checkTransactionStatus,
  checkSessionStatus
} = require('../controllers/paymentController');

// Protected routes (require authentication)
router.post('/init', protect, initPayment);
router.get('/history', protect, getPaymentHistory);
router.get('/transaction-status/:transactionId', protect, checkTransactionStatus);
router.get('/session-status/:sessionId', protect, checkSessionStatus);
router.get('/:id', protect, getPaymentDetails);

// Admin-only routes
router.post('/refund', protect, admin, initiateRefund);
router.get('/refund-status/:refundId', protect, admin, checkRefundStatus);

// Public routes for payment callbacks from SSLCommerz
router.post('/success', paymentSuccess);
router.post('/fail', paymentFailed);
router.post('/cancel', paymentCancelled);
router.post('/ipn', ipnHandler);
router.post('/validate', validateTransaction);

module.exports = router;

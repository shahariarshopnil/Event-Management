const asyncHandler = require('express-async-handler');
const sslCommerzService = require('../services/sslCommerzService');
const Booking = require('../models/bookingModel');
const Event = require('../models/eventModel');
const Package = require('../models/packageModel');
const Payment = require('../models/paymentModel');
const User = require('../models/userModel');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Initialize a payment transaction with SSLCommerz
 * @route   POST /api/payment/init
 * @access  Private
 */
const initPayment = asyncHandler(async (req, res) => {
  const { 
    eventId, 
    packageId, 
    quantity = 1, 
    currency = 'BDT',
    successUrl, 
    failUrl, 
    cancelUrl
  } = req.body;

  // Get user from auth middleware
  const user = req.user;

  // Validate inputs
  if (!eventId) {
    res.status(400);
    throw new Error('Event ID is required');
  }

  try {
    // Use the official SSLCommerz service
    const paymentResult = await sslCommerzService.initiatePayment({
      user,
      eventId,
      packageId,
      quantity,
      currency,
      successUrl: successUrl || `${process.env.CLIENT_URL}/payment-success`,
      failUrl: failUrl || `${process.env.CLIENT_URL}/payment-failed`,
      cancelUrl: cancelUrl || `${process.env.CLIENT_URL}/payment-cancelled`
    });

    // Return the payment session details
    res.status(200).json({
      status: 'success',
      data: {
        paymentId: paymentResult.paymentId,
        transactionId: paymentResult.transactionId,
        redirectGatewayURL: paymentResult.redirectUrl,
        status: paymentResult.status,
        message: paymentResult.message
      }
    });
  } catch (error) {
    console.error('SSLCommerz payment init error:', error);
    res.status(500);
    throw new Error('Failed to initialize payment. Please try again.');
  }
});

/**
 * @desc    Handle successful payment
 * @route   POST /api/payment/success
 * @access  Public
 */
const paymentSuccess = asyncHandler(async (req, res) => {
  const { val_id, tran_id, amount, card_type, store_amount, card_no, bank_tran_id, status, tran_date } = req.body;

  try {
    // Use the official SSLCommerz service to validate and process the payment
    const validationResult = await sslCommerzService.validatePayment({
      val_id,
      tran_id,
      amount,
      card_type,
      store_amount,
      card_no,
      bank_tran_id,
      status,
      tran_date
    });

    // Get the booking from the validation result
    const booking = validationResult.booking;

    // Include all necessary parameters for MyBookingsPage to highlight the new booking
    res.redirect(`${process.env.CLIENT_URL}/bookings?paymentSuccess=true&bookingId=${booking._id}&transactionId=${tran_id}`);
  } catch (error) {
    console.error('Payment success handling error:', error);
    res.redirect(`${process.env.CLIENT_URL}/payment-failed?reason=${error.message}&tran_id=${tran_id}`);
  }
});

/**
 * @desc    Handle failed payment
 * @route   POST /api/payment/fail
 * @access  Public
 */
const paymentFailed = asyncHandler(async (req, res) => {
  const { tran_id, error } = req.body;

  try {
    // Find and update the payment status in the database
    const payment = await Payment.findOne({ transactionId: tran_id });
    if (payment) {
      payment.status = 'FAILED';
      payment.metadata = {
        ...payment.metadata,
        failureReason: error || 'Payment failed'
      };
      await payment.save();
    }

    // Redirect to failure page
    res.redirect(`${process.env.CLIENT_URL}/payment-failed?transactionId=${tran_id}`);
  } catch (error) {
    console.error('Payment failure handling error:', error);
    res.redirect(`${process.env.CLIENT_URL}/payment-failed?reason=server_error`);
  }
});

/**
 * @desc    Handle cancelled payment
 * @route   POST /api/payment/cancel
 * @access  Public
 */
const paymentCancelled = asyncHandler(async (req, res) => {
  const { tran_id } = req.body;

  try {
    // Find and update the payment status in the database
    const payment = await Payment.findOne({ transactionId: tran_id });
    if (payment) {
      payment.status = 'CANCELLED';
      payment.metadata = {
        ...payment.metadata,
        cancelledAt: new Date()
      };
      await payment.save();
    }

    // Redirect to cancellation page
    res.redirect(`${process.env.CLIENT_URL}/payment-cancelled?transactionId=${tran_id}`);
  } catch (error) {
    console.error('Payment cancellation handling error:', error);
    res.redirect(`${process.env.CLIENT_URL}/payment-cancelled?reason=server_error`);
  }
});

/**
 * @desc    Get payment history for a user
 * @route   GET /api/payment/history
 * @access  Private
 */
const getPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const payments = await Payment.find({ user: userId })
      .populate('event', 'title date time')
      .populate('package', 'name price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500);
    throw new Error('Failed to fetch payment history');
  }
});

/**
 * @desc    Get payment details
 * @route   GET /api/payment/:id
 * @access  Private
 */
const getPaymentDetails = asyncHandler(async (req, res) => {
  const paymentId = req.params.id;
  const userId = req.user._id;

  try {
    const payment = await Payment.findById(paymentId)
      .populate('event', 'title date time price location organizer')
      .populate('package', 'name price features')
      .populate('user', 'name email');

    // Check if payment exists
    if (!payment) {
      res.status(404);
      throw new Error('Payment not found');
    }

    // Check if user owns this payment or is admin
    if (payment.user._id.toString() !== userId.toString() && !req.user.isAdmin) {
      res.status(403);
      throw new Error('Not authorized to access this payment');
    }

    res.status(200).json({
      status: 'success',
      data: payment
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    if (!error.statusCode) {
      res.status(500);
      error.message = 'Failed to fetch payment details';
    }
    throw error;
  }
});

module.exports = {
  initPayment,
  paymentSuccess,
  paymentFailed,
  paymentCancelled,
  getPaymentHistory,
  getPaymentDetails,

  /**
   * @desc    Validate transaction after successful payment
   * @route   POST /api/payment/validate
   * @access  Public
   */
  validateTransaction: asyncHandler(async (req, res) => {
    const { val_id, tran_id } = req.body;
    
    if (!val_id) {
      res.status(400);
      throw new Error('Validation ID is required');
    }

    try {
      // Use the official SSLCommerz service to validate the transaction
      const validationResult = await sslCommerzService.validatePayment({
        val_id,
        tran_id
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Transaction validated successfully',
        data: {
          payment: validationResult.payment,
          booking: validationResult.booking,
          validationDetails: validationResult.validationDetails
        }
      });
    } catch (error) {
      console.error('Error validating transaction:', error);
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.message || 'Error validating transaction',
      });
    }
  }),

  /**
   * @desc    IPN (Instant Payment Notification) handler
   * @route   POST /api/payment/ipn
   * @access  Public
   */
  ipnHandler: asyncHandler(async (req, res) => {
    // SSLCommerz will send data to this endpoint
    const ipnData = req.body;
    
    try {
      // Log IPN data for debugging
      console.log('IPN Data received:', ipnData);
      
      if (ipnData.status === 'VALID') {
        // Find the payment in our database
        const payment = await Payment.findOne({ transactionId: ipnData.tran_id });
        
        if (payment) {
          // Update payment status
          payment.status = 'COMPLETED';
          payment.metadata.ipnResponse = ipnData;
          await payment.save();
          
          // If this is a new successful payment, process the booking
          if (payment.status !== 'COMPLETED') {
            // Extract event and user IDs from SSLCommerz value_a and value_d fields
            const eventId = ipnData.value_a;
            const userId = ipnData.value_d;
            const packageId = ipnData.value_b || null;
            const quantity = parseInt(ipnData.value_c, 10) || 1;
            
            if (eventId && userId) {
              // Create or update booking
              await processBookingAfterPayment(userId, eventId, packageId, quantity, payment._id);
            }
          }
        } else {
          console.error('Payment record not found for IPN:', ipnData.tran_id);
        }
      } else if (['FAILED', 'CANCELLED'].includes(ipnData.status)) {
        // Handle failed payment
        const payment = await Payment.findOne({ transactionId: ipnData.tran_id });
        
        if (payment) {
          payment.status = ipnData.status;
          payment.metadata.ipnResponse = ipnData;
          await payment.save();
        }
      }
      
      // Always send success response to SSLCommerz IPN
      res.status(200).json({ status: 'success', message: 'IPN received' });
    } catch (error) {
      console.error('Error processing IPN:', error);
      // Still send 200 to SSLCommerz to prevent retries
      res.status(200).json({ status: 'error', message: error.message });
    }
  }),

  /**
   * @desc    Initiate a refund for a payment
   * @route   POST /api/payment/refund
   * @access  Private/Admin
   */
  initiateRefund: asyncHandler(async (req, res) => {
    const { paymentId, refundAmount, refundRemarks } = req.body;
    
    if (!paymentId || !refundAmount) {
      res.status(400);
      throw new Error('Payment ID and refund amount are required');
    }
    
    try {
      // Use the official SSLCommerz service to initiate refund
      const refundResult = await sslCommerzService.initiateRefund({
        paymentId,
        refundAmount,
        refundRemarks
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Refund initiated successfully',
        data: {
          payment: refundResult.payment,
          refundDetails: refundResult.refundDetails
        }
      });
    } catch (error) {
      console.error('Error initiating refund:', error);
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.message || 'Error initiating refund',
      });
    }
  }),

  /**
   * @desc    Check refund status
   * @route   GET /api/payment/refund-status/:refundId
   * @access  Private
   */
  checkRefundStatus: asyncHandler(async (req, res) => {
    const refundId = req.params.refundId;
    
    if (!refundId) {
      res.status(400);
      throw new Error('Refund ID is required');
    }
    
    try {
      // Query refund status from SSLCommerz
      const refundStatusResponse = await sslcommerz.refundQuery({ refund_ref_id: refundId });
      
      res.status(200).json({
        status: 'success',
        message: 'Refund status retrieved successfully',
        data: refundStatusResponse
      });
    } catch (error) {
      console.error('Error checking refund status:', error);
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.message || 'Error checking refund status',
      });
    }
  }),

  /**
   * @desc    Query transaction status by transaction ID
   * @route   GET /api/payment/transaction-status/:transactionId
   * @access  Private
   */
  checkTransactionStatus: asyncHandler(async (req, res) => {
    const transactionId = req.params.transactionId;
    
    if (!transactionId) {
      res.status(400);
      throw new Error('Transaction ID is required');
    }
    
    try {
      // Use the official SSLCommerz service to check transaction status
      const statusResult = await sslCommerzService.queryTransaction(transactionId);
      
      res.status(200).json({
        status: 'success',
        message: 'Transaction status retrieved successfully',
        data: {
          payment: statusResult.payment,
          transactionDetails: statusResult.transactionDetails
        }
      });
    } catch (error) {
      console.error('Error checking transaction status:', error);
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.message || 'Error checking transaction status',
      });
    }
  }),

  /**
   * @desc    Query transaction status by session ID
   * @route   GET /api/payment/session-status/:sessionId
   * @access  Private
   */
  checkSessionStatus: asyncHandler(async (req, res) => {
    const sessionId = req.params.sessionId;
    
    if (!sessionId) {
      res.status(400);
      throw new Error('Session ID is required');
    }
    
    try {
      // Query transaction status from SSLCommerz
      const sessionStatusResponse = await sslcommerz.transactionQueryBySessionId({
        sessionkey: sessionId
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Session status retrieved successfully',
        data: sessionStatusResponse
      });
    } catch (error) {
      console.error('Error checking session status:', error);
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.message || 'Error checking session status',
      });
    }
  }),
};

// Helper function to process booking after successful payment
async function processBookingAfterPayment(userId, eventId, packageId, quantity, paymentId) {
  try {
    // Get user and event details
    const [user, event] = await Promise.all([
      User.findById(userId),
      Event.findById(eventId)
    ]);
    
    if (!user || !event) {
      throw new Error('User or event not found');
    }
    
    // Get package if specified
    let selectedPackage = null;
    if (packageId) {
      selectedPackage = await Package.findById(packageId);
      if (!selectedPackage) {
        throw new Error('Package not found');
      }
    }
    
    // Create a new booking
    const booking = new Booking({
      user: userId,
      event: eventId,
      package: packageId || null,
      quantity,
      payment: paymentId,
      status: 'CONFIRMED',
      price: selectedPackage ? selectedPackage.price : event.price,
      bookingDate: new Date(),
    });
    
    await booking.save();
    
    // Update event attendee count
    event.attendees = (event.attendees || 0) + quantity;
    await event.save();
    
    return booking;
  } catch (error) {
    console.error('Error processing booking after payment:', error);
    throw error;
  }
}

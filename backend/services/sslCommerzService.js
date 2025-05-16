const SSLCommerzPayment = require('sslcommerz-lts');
const Payment = require('../models/paymentModel');
const Booking = require('../models/bookingModel');
const Event = require('../models/eventModel');
const Package = require('../models/packageModel');
const { v4: uuidv4 } = require('uuid');

/**
 * Service class for handling SSLCommerz payment gateway operations
 * Uses the official sslcommerz-lts library
 */
class SSLCommerzService {
  constructor() {
    this.store_id = process.env.SSLCOMMERZ_STORE_ID;
    this.store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
    this.is_live = process.env.SSLCOMMERZ_IS_LIVE === 'true';
  }

  /**
   * Initialize a payment transaction
   * @param {Object} paymentDetails - Payment details including user, event, and package info
   * @returns {Object} Payment session with redirect URL
   */
  async initiatePayment(paymentDetails) {
    const {
      user,
      eventId,
      packageId,
      quantity,
      currency = 'BDT',
      successUrl,
      failUrl,
      cancelUrl
    } = paymentDetails;

    try {
      // Get event details
      const event = await Event.findById(eventId).populate('organizer');
      if (!event) {
        throw new Error('Event not found');
      }

      // Get package details if specified
      let packageData;
      if (packageId) {
        packageData = await Package.findById(packageId);
        if (!packageData) {
          throw new Error('Package not found');
        }
      }

      // Calculate payment amount
      const ticketPrice = packageData ? packageData.price : event.price;
      const totalAmount = ticketPrice * quantity;

      // Generate a unique transaction ID
      const transactionId = `EVENT-${eventId.substring(0, 5)}-${Date.now()}-${uuidv4().substring(0, 6)}`;

      // Create payment data for SSLCommerz
      const paymentData = {
        total_amount: totalAmount,
        currency,
        tran_id: transactionId,
        success_url: successUrl || `${process.env.CLIENT_URL}/payment-success`,
        fail_url: failUrl || `${process.env.CLIENT_URL}/payment-failed`,
        cancel_url: cancelUrl || `${process.env.CLIENT_URL}/payment-cancelled`,
        ipn_url: `${process.env.CLIENT_URL}/api/payment/ipn`,
        shipping_method: 'NO',
        product_name: packageData ? `${event.title} - ${packageData.name} Package` : event.title,
        product_category: 'Event Ticket',
        product_profile: 'general',
        cus_name: user.name,
        cus_email: user.email,
        cus_phone: user.phone || '01700000000',
        cus_add1: 'Dhaka',
        cus_city: 'Dhaka',
        cus_country: 'Bangladesh',
        cus_postcode: '1000',
        value_a: eventId,
        value_b: packageId || '',
        value_c: quantity,
        value_d: user._id.toString()
      };

      // Initialize the SSLCommerz client
      const sslcz = new SSLCommerzPayment(this.store_id, this.store_passwd, this.is_live);
      
      // Initialize payment
      const sslResponse = await sslcz.init(paymentData);

      // Create a payment record in our database
      const payment = new Payment({
        user: user._id,
        event: eventId,
        packageId: packageId || null,
        amount: totalAmount,
        currency,
        transactionId,
        status: 'PENDING',
        paymentGateway: 'SSLCOMMERZ',
        quantity,
        metadata: {
          gatewayResponse: sslResponse
        }
      });

      await payment.save();

      // Return payment details with redirect URL
      return {
        success: sslResponse.status === 'SUCCESS',
        paymentId: payment._id,
        transactionId,
        redirectUrl: sslResponse.GatewayPageURL || null,
        status: sslResponse.status,
        message: sslResponse.status === 'SUCCESS' 
          ? 'Redirecting to payment gateway' 
          : 'Failed to initialize payment'
      };
    } catch (error) {
      console.error('SSLCommerz payment initialization error:', error);
      throw error;
    }
  }

  /**
   * Validate a payment transaction
   * @param {Object} validationData - Data containing validation ID
   * @returns {Object} - Validation result
   */
  async validatePayment(validationData) {
    const { val_id, tran_id } = validationData;

    try {
      if (!val_id) {
        throw new Error('Validation ID is required');
      }

      // Initialize the SSLCommerz client
      const sslcz = new SSLCommerzPayment(this.store_id, this.store_passwd, this.is_live);
      
      // Validate the transaction
      const validationResponse = await sslcz.validate({ val_id });
      
      if (validationResponse.status !== 'VALID') {
        throw new Error('Payment validation failed');
      }

      // Find the payment in our database
      const payment = await Payment.findOne({ transactionId: tran_id || validationResponse.tran_id });
      if (!payment) {
        throw new Error('Payment record not found');
      }

      // Update payment status
      payment.status = 'COMPLETED';
      payment.metadata = {
        ...payment.metadata,
        validationResponse
      };

      await payment.save();

      // Create booking after successful payment
      const booking = await this.createBookingAfterPayment(payment);

      return {
        success: true,
        payment,
        booking,
        validationDetails: validationResponse
      };
    } catch (error) {
      console.error('Payment validation error:', error);
      throw error;
    }
  }

  /**
   * Create a booking after successful payment
   * @param {Object} payment - Payment record
   * @returns {Object} Created booking
   */
  async createBookingAfterPayment(payment) {
    try {
      // Extract necessary details from payment
      const eventId = payment.event;
      const packageId = payment.packageId;
      const userId = payment.user;
      const quantity = payment.quantity || 1;

      // Find the event and update available slots
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Update slot availability
      event.availableSlots = Math.max(0, event.availableSlots - quantity);
      if (!event.attendees.includes(userId)) {
        event.attendees.push(userId);
      }
      await event.save();

      // If there's a package, update its availability too
      if (packageId) {
        const packageData = await Package.findById(packageId);
        if (packageData) {
          packageData.availableBookings = Math.max(0, packageData.availableBookings - quantity);
          await packageData.save();
        }
      }

      // Check if booking already exists
      const existingBooking = await Booking.findOne({ 
        user: userId, 
        event: eventId,
        payment: payment._id 
      });

      if (existingBooking) {
        // Update existing booking
        existingBooking.status = 'confirmed';
        await existingBooking.save();
        return existingBooking;
      }

      // Create a new booking
      const booking = new Booking({
        user: userId,
        event: eventId,
        packageId: packageId || null,
        quantity,
        ticketPrice: payment.amount / quantity,
        totalAmount: payment.amount,
        paymentId: payment._id,
        status: 'confirmed',
        bookedAt: new Date(),
      });

      await booking.save();
      return booking;
    } catch (error) {
      console.error('Error creating booking after payment:', error);
      throw error;
    }
  }

  /**
   * Query transaction status by transaction ID
   * @param {string} transactionId - Transaction ID
   * @returns {Object} - Transaction status
   */
  async queryTransaction(transactionId) {
    try {
      // Initialize the SSLCommerz client
      const sslcz = new SSLCommerzPayment(this.store_id, this.store_passwd, this.is_live);
      
      // Query transaction status
      const transactionResponse = await sslcz.transactionQueryByTransactionId({ tran_id: transactionId });
      
      // Find payment record in our database
      const payment = await Payment.findOne({ transactionId });
      
      // Update payment status if needed
      if (payment && transactionResponse.status) {
        const statusMapping = {
          'VALID': 'COMPLETED',
          'VALIDATED': 'COMPLETED',
          'FAILED': 'FAILED',
          'CANCELLED': 'CANCELLED',
          'UNATTEMPTED': 'PENDING',
          'EXPIRED': 'FAILED'
        };
        
        const newStatus = statusMapping[transactionResponse.status] || payment.status;
        
        if (payment.status !== newStatus) {
          payment.status = newStatus;
          payment.metadata.transactionQueryResponse = transactionResponse;
          await payment.save();
        }
      }
      
      return {
        success: true,
        payment: payment || null,
        transactionDetails: transactionResponse
      };
    } catch (error) {
      console.error('Transaction query error:', error);
      throw error;
    }
  }

  /**
   * Initiate a refund for a payment
   * @param {Object} refundData - Refund details
   * @returns {Object} - Refund result
   */
  async initiateRefund(refundData) {
    const { paymentId, refundAmount, refundRemarks } = refundData;
    
    try {
      // Get payment record
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment record not found');
      }
      
      if (payment.status !== 'COMPLETED') {
        throw new Error('Only completed payments can be refunded');
      }
      
      // Get bank transaction ID from payment metadata
      const bankTranId = payment.metadata?.validationResponse?.bank_tran_id || 
                         payment.metadata?.ipnResponse?.bank_tran_id;
      
      if (!bankTranId) {
        throw new Error('Bank transaction ID not found');
      }
      
      // Generate a reference ID for the refund
      const refId = `REF-${uuidv4().substring(0, 8)}`;
      
      // Prepare refund data
      const sslRefundData = {
        refund_amount: refundAmount,
        refund_remarks: refundRemarks || 'Event ticket refund',
        bank_tran_id: bankTranId,
        refe_id: refId,
      };
      
      // Initialize the SSLCommerz client
      const sslcz = new SSLCommerzPayment(this.store_id, this.store_passwd, this.is_live);
      
      // Initiate refund
      const refundResponse = await sslcz.initiateRefund(sslRefundData);
      
      // Update payment record
      payment.status = 'REFUNDED';
      payment.metadata.refundResponse = refundResponse;
      payment.metadata.refundId = refId;
      payment.metadata.refundAmount = refundAmount;
      payment.metadata.refundRemarks = refundRemarks;
      await payment.save();
      
      // Update booking status if it exists
      const booking = await Booking.findOne({ payment: payment._id });
      if (booking) {
        booking.status = 'REFUNDED';
        booking.metadata = booking.metadata || {};
        booking.metadata.refundDetails = {
          refundId: refId,
          refundAmount,
          refundDate: new Date(),
          refundRemarks
        };
        await booking.save();
      }
      
      return {
        success: true,
        payment,
        refundDetails: refundResponse
      };
    } catch (error) {
      console.error('Refund initiation error:', error);
      throw error;
    }
  }

  /**
   * Check refund status
   * @param {string} refundId - Refund reference ID
   * @returns {Object} - Refund status
   */
  async checkRefundStatus(refundId) {
    try {
      // Initialize the SSLCommerz client
      const sslcz = new SSLCommerzPayment(this.store_id, this.store_passwd, this.is_live);
      
      // Query refund status
      const refundStatus = await sslcz.refundQuery({ refund_ref_id: refundId });
      
      return {
        success: true,
        refundStatus
      };
    } catch (error) {
      console.error('Refund status check error:', error);
      throw error;
    }
  }
}

module.exports = new SSLCommerzService();

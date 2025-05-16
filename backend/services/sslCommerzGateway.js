const axios = require('axios');
const sslcommerz = require('../utils/sslcommerz');
const Payment = require('../models/paymentModel');
const Booking = require('../models/bookingModel');
const Event = require('../models/eventModel');
const Package = require('../models/packageModel');

/**
 * Dedicated SSLCommerz Payment Gateway Service
 * Centralizes all SSLCommerz payment operations in one service
 */
class SSLCommerzGateway {
  /**
   * Initialize a payment transaction with SSLCommerz
   * @param {Object} paymentDetails - Payment details including user, event, and package info
   * @returns {Object} Payment session with redirect URL
   */
  async initiateTransaction(paymentDetails) {
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
      let package;
      if (packageId) {
        package = await Package.findById(packageId);
        if (!package) {
          throw new Error('Package not found');
        }
      }

      // Calculate payment amount
      const ticketPrice = package ? package.price : event.price;
      const totalAmount = ticketPrice * quantity;

      // Generate a unique transaction ID
      const transactionId = sslcommerz.generateTransactionId();

      // Create payment data for SSLCommerz
      const paymentData = {
        total_amount: totalAmount,
        currency,
        tran_id: transactionId,
        success_url: successUrl || `${process.env.CLIENT_URL}/payment-success`,
        fail_url: failUrl || `${process.env.CLIENT_URL}/payment-failed`,
        cancel_url: cancelUrl || `${process.env.CLIENT_URL}/payment-cancelled`,
        cus_name: user.name,
        cus_email: user.email,
        cus_phone: user.phone || '01700000000',
        product_name: package ? `${event.title} - ${package.name} Package` : event.title,
        product_category: 'Event Ticket',
        value_a: eventId,
        value_b: packageId || '',
        value_c: quantity,
        value_d: user._id.toString(),
      };

      // No preferred payment method - SSLCommerz will show all available options

      // Initialize the payment with SSLCommerz
      const sslResponse = await sslcommerz.initPayment(paymentData);

      // Create a payment record in our database
      const payment = new Payment({
        user: user._id,
        event: eventId,
        package: packageId || null,
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
      console.error('SSLCommerz gateway error:', error);
      throw error;
    }
  }

  /**
   * Validate a completed payment
   * @param {Object} validationData - Validation data from SSLCommerz
   * @returns {Object} Validation result and booking details
   */
  async validateTransaction(validationData) {
    const { val_id, tran_id, amount, card_type, bank_tran_id, status } = validationData;

    try {
      // Validate the payment with SSLCommerz
      const validationResponse = await sslcommerz.validatePayment({ val_id });

      if (validationResponse.status !== 'VALID') {
        throw new Error('Payment validation failed');
      }

      // Find the payment in our database
      const payment = await Payment.findOne({ transactionId: tran_id });
      if (!payment) {
        throw new Error('Payment record not found');
      }

      // Update payment status
      payment.status = 'COMPLETED';
      payment.metadata = {
        ...payment.metadata,
        validationResponse,
        cardType: card_type,
        bankTransactionId: bank_tran_id,
        paidAmount: amount
      };

      await payment.save();

      // Create a booking and update event/package availability
      const bookingResult = await this.createBookingAfterPayment(payment);

      return {
        success: true,
        payment,
        booking: bookingResult,
        validationDetails: validationResponse
      };
    } catch (error) {
      console.error('Transaction validation error:', error);
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
      const packageId = payment.package;
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
        const package = await Package.findById(packageId);
        if (package) {
          package.availableBookings = Math.max(0, package.availableBookings - quantity);
          await package.save();
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
        package: packageId || null,
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
   * Handle a failed transaction
   * @param {Object} failData - Failed transaction data
   * @returns {Object} Updated payment record
   */
  async handleFailedTransaction(failData) {
    const { tran_id, error } = failData;

    try {
      // Find the payment in our database
      const payment = await Payment.findOne({ transactionId: tran_id });
      if (!payment) {
        throw new Error('Payment record not found');
      }

      // Update payment status
      payment.status = 'FAILED';
      payment.metadata = {
        ...payment.metadata,
        failureReason: error
      };

      await payment.save();
      return payment;
    } catch (error) {
      console.error('Failed transaction handling error:', error);
      throw error;
    }
  }

  /**
   * Handle a cancelled transaction
   * @param {Object} cancelData - Cancelled transaction data
   * @returns {Object} Updated payment record
   */
  async handleCancelledTransaction(cancelData) {
    const { tran_id } = cancelData;

    try {
      // Find the payment in our database
      const payment = await Payment.findOne({ transactionId: tran_id });
      if (!payment) {
        throw new Error('Payment record not found');
      }

      // Update payment status
      payment.status = 'CANCELLED';
      await payment.save();
      
      return payment;
    } catch (error) {
      console.error('Cancelled transaction handling error:', error);
      throw error;
    }
  }

  /**
   * Get transaction status
   * @param {string} transactionId - Transaction ID
   * @returns {Object} Transaction status from SSLCommerz and our database
   */
  async getTransactionStatus(transactionId) {
    try {
      // Query transaction status from SSLCommerz
      const transactionStatusResponse = await sslcommerz.transactionQueryByTransactionId({
        tran_id: transactionId
      });
      
      // Update our payment record with the latest status if needed
      const payment = await Payment.findOne({ transactionId });
      if (payment && transactionStatusResponse.status) {
        const statusMapping = {
          'VALID': 'COMPLETED',
          'VALIDATED': 'COMPLETED',
          'FAILED': 'FAILED',
          'CANCELLED': 'CANCELLED',
          'UNATTEMPTED': 'PENDING',
          'EXPIRED': 'FAILED'
        };
        
        const newStatus = statusMapping[transactionStatusResponse.status] || payment.status;
        
        if (payment.status !== newStatus) {
          payment.status = newStatus;
          payment.metadata.statusCheckResponse = transactionStatusResponse;
          await payment.save();
        }
      }

      return {
        payment: payment || null,
        gatewayStatus: transactionStatusResponse
      };
    } catch (error) {
      console.error('Error checking transaction status:', error);
      throw error;
    }
  }
}

module.exports = new SSLCommerzGateway();

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

/**
 * Utility functions for SSLCommerz payment gateway integration
 */
class SSLCommerz {
  constructor() {
    this.store_id = process.env.SSLCOMMERZ_STORE_ID;
    this.store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
    this.is_live = process.env.SSLCOMMERZ_IS_LIVE === 'true';
    this.init_url = process.env.SSLCOMMERZ_INIT_URL;
    this.validation_url = process.env.SSLCOMMERZ_VALIDATION_URL;
    this.refund_url = this.is_live ? 'https://securepay.sslcommerz.com/api/refund.php' : 'https://sandbox.sslcommerz.com/api/refund.php';
    this.refund_query_url = this.is_live ? 'https://securepay.sslcommerz.com/api/refund-status.php' : 'https://sandbox.sslcommerz.com/api/refund-status.php';
    this.transaction_query_url = this.is_live ? 'https://securepay.sslcommerz.com/api/transaction-status.php' : 'https://sandbox.sslcommerz.com/api/transaction-status.php';
  }

  /**
   * Initialize a payment transaction with SSLCommerz
   * 
   * @param {Object} paymentData - Payment details including amount, customer info, etc.
   * @returns {Promise<Object>} The response from SSLCommerz API
   */
  async initPayment(paymentData) {
    try {
      const { 
        total_amount, 
        currency, 
        tran_id, 
        success_url, 
        fail_url, 
        cancel_url, 
        cus_name,
        cus_email,
        cus_phone,
        product_name,
        product_category,
        shipping_method,
        multi_card_name,
        ipn_url,
        value_a,
        value_b,
        value_c,
        value_d
      } = paymentData;

      // Construct the POST data for SSLCommerz
      const postData = {
        store_id: this.store_id,
        store_passwd: this.store_passwd,
        total_amount: total_amount,
        currency: currency || 'BDT',
        tran_id: tran_id || `EVENT-${uuidv4()}`,
        success_url: success_url || `${process.env.CLIENT_URL}/payment/success`,
        fail_url: fail_url || `${process.env.CLIENT_URL}/payment/failed`,
        cancel_url: cancel_url || `${process.env.CLIENT_URL}/payment/cancel`,
        ipn_url: ipn_url || `${process.env.CLIENT_URL}/api/payment/ipn`,
        cus_name: cus_name || 'Not Provided',
        cus_email: cus_email || 'example@example.com',
        cus_phone: cus_phone || '01700000000',
        product_name: product_name || 'Event Ticket',
        product_category: product_category || 'Event',
        product_profile: 'general',
        shipping_method: shipping_method || 'NO',
        multi_card_name: multi_card_name || '',
        num_of_item: 1,
        value_a: value_a || '',
        value_b: value_b || '',
        value_c: value_c || '',
        value_d: value_d || ''
      };

      // Make the API call to SSLCommerz
      const response = await axios.post(this.init_url, postData);
      return response.data;
    } catch (error) {
      console.error('Error initializing SSLCommerz payment:', error);
      throw error;
    }
  }

  /**
   * Validate a transaction against SSLCommerz
   * 
   * @param {Object} data - Data containing validation ID (val_id)
   * @returns {Promise<Object>} The validation response
   */
  async validatePayment(data) {
    try {
      const { val_id } = data;
      if (!val_id) {
        throw new Error('Validation ID is required');
      }
      
      const validationUrl = `${this.validation_url}?val_id=${val_id}&store_id=${this.store_id}&store_passwd=${this.store_passwd}&format=json&v=1`;
      
      const response = await axios.get(validationUrl);
      return response.data;
    } catch (error) {
      console.error('Error validating SSLCommerz payment:', error);
      throw error;
    }
  }

  /**
   * Initiate a refund through SSLCommerz API
   * 
   * @param {Object} data - Refund data including amount, transaction details
   * @returns {Promise<Object>} The refund response
   */
  async initiateRefund(data) {
    try {
      const { refund_amount, refund_remarks, bank_tran_id, refe_id } = data;
      
      if (!refund_amount || !bank_tran_id) {
        throw new Error('Refund amount and bank transaction ID are required');
      }
      
      const postData = {
        store_id: this.store_id,
        store_passwd: this.store_passwd,
        refund_amount,
        refund_remarks: refund_remarks || 'Event ticket refund',
        bank_tran_id,
        refe_id: refe_id || '',
        format: 'json'
      };
      
      const response = await axios.post(this.refund_url, postData);
      return response.data;
    } catch (error) {
      console.error('Error initiating SSLCommerz refund:', error);
      throw error;
    }
  }

  /**
   * Query the status of a refund request
   * 
   * @param {Object} data - Query data containing refund reference ID
   * @returns {Promise<Object>} The refund status
   */
  async refundQuery(data) {
    try {
      const { refund_ref_id } = data;
      
      if (!refund_ref_id) {
        throw new Error('Refund reference ID is required');
      }
      
      const queryUrl = `${this.refund_query_url}?refund_ref_id=${refund_ref_id}&store_id=${this.store_id}&store_passwd=${this.store_passwd}&format=json`;
      
      const response = await axios.get(queryUrl);
      return response.data;
    } catch (error) {
      console.error('Error querying SSLCommerz refund status:', error);
      throw error;
    }
  }

  /**
   * Query transaction status by transaction ID
   * 
   * @param {Object} data - Query data containing transaction ID
   * @returns {Promise<Object>} The transaction status
   */
  async transactionQueryByTransactionId(data) {
    try {
      const { tran_id } = data;
      
      if (!tran_id) {
        throw new Error('Transaction ID is required');
      }
      
      const queryUrl = `${this.transaction_query_url}?tran_id=${tran_id}&store_id=${this.store_id}&store_passwd=${this.store_passwd}&format=json`;
      
      const response = await axios.get(queryUrl);
      return response.data;
    } catch (error) {
      console.error('Error querying SSLCommerz transaction by ID:', error);
      throw error;
    }
  }

  /**
   * Query transaction status by session ID
   * 
   * @param {Object} data - Query data containing session key
   * @returns {Promise<Object>} The transaction status
   */
  async transactionQueryBySessionId(data) {
    try {
      const { sessionkey } = data;
      
      if (!sessionkey) {
        throw new Error('Session key is required');
      }
      
      const queryUrl = `${this.transaction_query_url}?sessionkey=${sessionkey}&store_id=${this.store_id}&store_passwd=${this.store_passwd}&format=json`;
      
      const response = await axios.get(queryUrl);
      return response.data;
    } catch (error) {
      console.error('Error querying SSLCommerz transaction by session ID:', error);
      throw error;
    }
  }

  /**
   * Generate a unique transaction ID for SSLCommerz
   * 
   * @param {string} prefix - Prefix for the transaction ID
   * @returns {string} The generated transaction ID
   */
  generateTransactionId(prefix = 'EVENT') {
    return `${prefix}-${uuidv4()}`;
  }
}

module.exports = new SSLCommerz();

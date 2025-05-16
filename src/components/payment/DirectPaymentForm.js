import React, { useEffect } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';

/**
 * A component that creates a direct form submission to SSLCommerz
 * This approach is more reliable than the AJAX approach for payment gateways
 */
const DirectPaymentForm = ({ paymentData, loading }) => {
  // SSLCommerz sandbox endpoint
  const sslCommerzEndpoint = 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';
  
  // Debug logging
  useEffect(() => {
    console.log('DirectPaymentForm received payment data:', paymentData);
  }, [paymentData]);
  
  // Generate a unique transaction ID that includes event and package info for tracking
  const transactionId = `EVENT-${paymentData.eventId}-${paymentData.packageId}-${Date.now()}`;

  // Transform our payment data to match SSLCommerz expected format
  const transformedData = {
    store_id: 'shaha6823bdf364517', // From your .env file
    store_passwd: 'shaha6823bdf364517@ssl', // From your .env file
    total_amount: paymentData.totalAmount,
    currency: paymentData.currency || 'BDT',
    tran_id: transactionId, // Use our generated transaction ID
    // Added more parameters to pass to success page to ensure complete details
    success_url: `${window.location.origin}/payment-success?tran_id=${transactionId}&status=VALID&amount=${paymentData.totalAmount}&currency=${paymentData.currency || 'BDT'}&event_id=${paymentData.eventId}&package_id=${paymentData.packageId}&quantity=${paymentData.quantity}`,
    fail_url: `${window.location.origin}/payment-failed?tran_id=${transactionId}&status=FAILED`,
    cancel_url: `${window.location.origin}/payment-cancelled?tran_id=${transactionId}&status=CANCELLED`,
    cus_name: paymentData.cus_name || 'Customer',
    cus_email: paymentData.cus_email || 'customer@example.com',
    cus_phone: paymentData.cus_phone || '01700000000',
    product_name: paymentData.product_name || 'Event Ticket',
    product_category: paymentData.product_category || 'Events',
    product_profile: 'general',
    cus_add1: 'Dhaka',
    cus_city: 'Dhaka',
    cus_country: 'Bangladesh',
    shipping_method: 'NO',
    num_of_item: paymentData.quantity || 1,
    value_a: paymentData.eventId, // Store your event ID
    value_b: paymentData.packageId, // Store your package ID
    value_c: paymentData.quantity, // Store quantity
  };
  
  // Add preferred payment method if specified
  if (paymentData.preferred_method) {
    transformedData.multi_card_name = paymentData.preferred_method;
  }

  // Auto-submit function to immediately redirect to payment gateway
  const formRef = React.useRef(null);
  
  useEffect(() => {
    // Auto-submit the form after a short delay to ensure it's fully rendered
    const timer = setTimeout(() => {
      if (formRef.current && !loading) {
        console.log('Auto-submitting payment form...');
        formRef.current.submit();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);
  
  return (
    <div>
      <div className="alert alert-info mb-3">
        <Spinner as="span" animation="border" size="sm" className="me-2" />
        Connecting to payment gateway... Please wait.
      </div>
      
      <Form ref={formRef} action={sslCommerzEndpoint} method="POST">
        {/* Create hidden form fields for all SSLCommerz parameters */}
        {Object.entries(transformedData).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value || ''} />
        ))}
        
        <Button 
          type="submit" 
          variant="primary" 
          size="lg" 
          className="w-100"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            'Proceed to Payment'
          )}
        </Button>
      </Form>
    </div>
  );
};

export default DirectPaymentForm;

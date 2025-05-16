import React, { useState } from 'react';
import { Card, Alert } from 'react-bootstrap';
import PaymentMethodSelector from './PaymentMethodSelector';
import DirectPaymentForm from './DirectPaymentForm';

/**
 * A component that handles the complete payment flow:
 * 1. First allows the user to select a payment method
 * 2. Then redirects to SSLCommerz with the selected payment method
 */
const PaymentProcessor = ({ paymentData }) => {
  const [step, setStep] = useState(1); // Step 1: Select payment method, Step 2: Process payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedPaymentData, setProcessedPaymentData] = useState(null);

  // Handle payment method selection and move to next step
  const handlePaymentMethodSelection = (updatedPaymentData) => {
    setLoading(true);
    
    try {
      // Store the payment data with selected method for the next step
      setProcessedPaymentData(updatedPaymentData);
      
      // Move to payment processing step
      setStep(2);
    } catch (err) {
      setError('Error preparing payment. Please try again.');
      console.error('Payment preparation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Body className="p-4">
        <Card.Title className="mb-4">Complete Your Payment</Card.Title>
        
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        
        {/* Step 1: Payment Method Selection */}
        {step === 1 && (
          <PaymentMethodSelector
            paymentData={paymentData}
            onSubmit={handlePaymentMethodSelection}
            loading={loading}
          />
        )}
        
        {/* Step 2: SSLCommerz Integration */}
        {step === 2 && processedPaymentData && (
          <DirectPaymentForm
            paymentData={processedPaymentData}
            loading={loading}
          />
        )}
      </Card.Body>
    </Card>
  );
};

export default PaymentProcessor;

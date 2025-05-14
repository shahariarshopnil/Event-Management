import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Spinner } from 'react-bootstrap';
import { FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

const PaymentMethodSelector = ({ paymentData, onSubmit, loading }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [error, setError] = useState(null);

  // Mobile banking methods based on SSLCommerz options
  const mobilePaymentOptions = [
    {
      name: "bKash",
      type: "mobilebanking",
      logo: "https://sandbox.sslcommerz.com/gwprocess/v4/image/gw/bkash.png",
      gw: "bkash"
    },
    {
      name: "Nagad",
      type: "mobilebanking",
      logo: "https://sandbox.sslcommerz.com/gwprocess/v4/image/gw/nagad.png",
      gw: "nagad"
    },
    {
      name: "DBBL Mobile Banking",
      type: "mobilebanking",
      logo: "https://sandbox.sslcommerz.com/gwprocess/v4/image/gw/dbblmobilebank.png",
      gw: "dbblmobilebanking"
    }
  ];

  // Set payment methods
  useEffect(() => {
    setPaymentMethods(mobilePaymentOptions);
    setLoadingMethods(false);
    
    // Auto-select the first payment method if none is selected
    if (mobilePaymentOptions.length > 0) {
      setSelectedMethod(mobilePaymentOptions[0]);
    }
  }, []);

  const handlePaymentMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedMethod) {
      // If somehow no method is selected, default to bKash
      setSelectedMethod(mobilePaymentOptions[0]);
      return;
    }
    
    console.log('Submitting payment method:', selectedMethod);
    
    // Include the selected payment method in the form submission
    const updatedPaymentData = {
      ...paymentData,
      preferred_method: selectedMethod.gw
    };
    
    onSubmit(updatedPaymentData);
  };

  if (loadingMethods) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading payment options...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h5 className="mb-3">Select Payment Method</h5>
      
      <Form onSubmit={handleSubmit}>
        <div className="mb-4">
          <h6 className="mb-3">Mobile Banking Options</h6>
          <Row xs={1} md={3} className="g-3">
            {paymentMethods.map((method) => (
              <Col key={method.gw}>
                <Card 
                  className={`payment-method-card ${selectedMethod?.gw === method.gw ? 'border-primary' : ''}`}
                  onClick={() => handlePaymentMethodSelect(method)}
                  style={{ cursor: 'pointer', height: '100%' }}
                >
                  <Card.Body className="text-center p-3">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <img 
                        src={method.logo} 
                        alt={method.name} 
                        style={{ height: '35px', objectFit: 'contain' }} 
                      />
                      {selectedMethod?.gw === method.gw && (
                        <FaCheckCircle className="text-primary" />
                      )}
                    </div>
                    <div>
                      <Form.Check
                        type="radio"
                        id={`payment-${method.gw}`}
                        name="paymentMethod"
                        label={method.name}
                        checked={selectedMethod?.gw === method.gw}
                        onChange={() => handlePaymentMethodSelect(method)}
                        className="d-flex align-items-center justify-content-center"
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          size="lg" 
          className="w-100" 
          disabled={!selectedMethod || loading}
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            `Pay with ${selectedMethod ? selectedMethod.name : 'Selected Method'}`
          )}
        </Button>
        
        <div className="text-center mt-3">
          <img 
            src="https://sandbox.sslcommerz.com/gwprocess/v4/image/gw/sslcommerz.png" 
            alt="Secured by SSLCommerz" 
            style={{ height: '30px' }}
          />
          <p className="small text-muted mt-2">Your payment is secured by SSLCommerz</p>
        </div>
      </Form>
    </div>
  );
};

export default PaymentMethodSelector;

import React, { useState } from 'react';
import { Form, Button, Card, Spinner, Row, Col } from 'react-bootstrap';
import { FaArrowLeft, FaMobileAlt } from 'react-icons/fa';

const MobileBankingForm = ({ paymentMethod, paymentData, onSubmit, onBack, loading }) => {
  const [phoneNumber, setPhoneNumber] = useState(paymentData.cus_phone || '');
  const [validated, setValidated] = useState(false);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    // Make sure phone number is valid
    if (!phoneNumber || phoneNumber.length < 11) {
      setValidated(true);
      return;
    }
    
    console.log('Submitting mobile form with phone:', phoneNumber);
    
    // Include the phone number in the payment data
    const updatedPaymentData = {
      ...paymentData,
      cus_phone: phoneNumber
    };
    
    onSubmit(updatedPaymentData);
  };
  
  return (
    <Card className="payment-form mb-4">
      <Card.Header className="bg-primary text-white">
        <div className="d-flex align-items-center">
          <img 
            src={paymentMethod.logo} 
            alt={paymentMethod.name} 
            style={{ height: '30px', marginRight: '10px' }} 
          />
          <h5 className="mb-0">{paymentMethod.name} Payment</h5>
        </div>
      </Card.Header>
      <Card.Body>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-4">
            <Form.Label>Enter your {paymentMethod.name} Mobile Number</Form.Label>
            <Form.Control
              type="tel"
              placeholder="e.g., 01XXXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              pattern="01[3-9][0-9]{8}"
              required
            />
            <Form.Control.Feedback type="invalid">
              Please enter a valid Bangladesh mobile number (format: 01XXXXXXXXX).
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Enter the mobile number registered with your {paymentMethod.name} account.
            </Form.Text>
          </Form.Group>
          
          <div className="payment-guidelines mb-4">
            <h6 className="text-muted mb-2">How to pay with {paymentMethod.name}:</h6>
            <ol className="small text-muted">
              <li>Enter your {paymentMethod.name} registered mobile number</li>
              <li>Click "Proceed to Payment"</li>
              <li>You'll be redirected to the secure payment page</li>
              <li>Follow the prompts to complete your payment</li>
              <li>After payment, you'll receive confirmation of your booking</li>
            </ol>
          </div>
          
          <Row>
            <Col>
              <Button 
                variant="outline-secondary" 
                className="w-100"
                onClick={onBack}
                disabled={loading}
              >
                <FaArrowLeft className="me-2" /> Back
              </Button>
            </Col>
            <Col>
              <Button 
                type="submit" 
                variant="primary" 
                className="w-100"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaMobileAlt className="me-2" />
                    Proceed to Payment
                  </>
                )}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default MobileBankingForm;

import React, { useState, useEffect } from 'react';
import { Card, Alert, Button, Spinner, Row, Col, Modal } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

/**
 * A dedicated gateway component for SSLCommerz payments
 * Directly initiates payment without showing payment method selection
 */
const SSLCommerzGateway = ({ 
  paymentData, 
  onPaymentInitiated = () => {},
  onPaymentCancelled = () => {} 
}) => {
  const [stage, setStage] = useState('PROCESSING'); // PROCESSING, REDIRECT, CONFIRMATION
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gatewayUrl, setGatewayUrl] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [bookingId, setBookingId] = useState(null);
  const { userInfo } = useSelector(state => state.auth);
  const navigate = useNavigate();

  // Initialize payment when component mounts
  useEffect(() => {
    // Initiate payment immediately without selecting a payment method
    initiatePayment();
  }, []);
  
  // Manage redirect countdown when confirmation is shown
  useEffect(() => {
    let timer;
    if (showConfirmation && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
    } else if (showConfirmation && redirectCountdown === 0) {
      // Redirect when countdown reaches zero
      if (gatewayUrl) {
        window.location.href = gatewayUrl;
      }
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showConfirmation, redirectCountdown, gatewayUrl]);

  // Directly initialize payment without selecting a payment method
  const initiatePayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Initiating payment with data:', paymentData);
      
      // Call our backend endpoint to initialize the payment
      const response = await axios.post(
        '/api/payment/init', 
        paymentData,  // No preferred method, let SSLCommerz show all options
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.token}`
          }
        }
      );
      
      const { data } = response;
      
      if (data.status === 'success') {
        setTransactionId(data.data.transactionId);
        setGatewayUrl(data.data.redirectGatewayURL);
        // Store booking ID if available in the response
        if (data.data.bookingId) {
          setBookingId(data.data.bookingId);
        }
        setStage('REDIRECT');
        
        // Notify parent component of successful initialization
        onPaymentInitiated({
          transactionId: data.data.transactionId,
          redirectUrl: data.data.redirectGatewayURL
        });
        
        toast.info('Redirecting to payment gateway...');
      } else {
        setError('Failed to initialize payment. Please try again.');
        toast.error('Payment initialization failed');
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      setError(err.response?.data?.message || 'Failed to initialize payment. Please try again.');
      toast.error('Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    setShowConfirmation(false);
    onPaymentCancelled();
  };
  
  // Handle proceed to payment button click
  const handleProceedToPayment = () => {
    // Show toast notification that payment is being set up
    toast.info('Preparing your secure payment gateway...', {
      position: 'top-right',
      autoClose: 1500,
      hideProgressBar: false,
    });
    setShowConfirmation(true);
  };
  
  // States for completion confirmation
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  // Handle direct redirection without waiting for countdown
  const handleImmediateRedirect = () => {
    // Show a success message first
    setShowCompletionMessage(true);
    setShowConfirmation(false);
    
    // Show toast notification
    toast.success('Payment completed successfully!', {
      position: 'top-center',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
    });
    
    // Set a delay before redirecting to allow user to see the success message
    setTimeout(() => {
      // Redirect to My Bookings page instead of SSLCommerz
      toast.info('Redirecting to My Bookings page...', {
        position: 'top-right',
        autoClose: 2000,
      });
      navigate('/bookings');
    }, 3500);
  };

  return (
    <>
      {showCompletionMessage ? (
        <Card className="shadow-sm mb-4 border-success">
          <Card.Body className="p-4 text-center">
            <div className="mb-4">
              <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                <FaCheckCircle size={40} />
              </div>
              <h2 className="mt-2">Payment Completed!</h2>
              <p className="lead text-muted">
                Your payment has been processed successfully.
              </p>
              <p className="mb-4">Transaction ID: <strong>{transactionId}</strong></p>
              <div className="d-flex justify-content-center align-items-center">
                <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                <p className="mb-0">Redirecting to payment gateway to complete your transaction...</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm mb-4">
          <Card.Body className="p-4">
            <Card.Title className="mb-4">
              <img 
                src="https://sandbox.sslcommerz.com/gwprocess/v4/image/gw/sslcommerz.png"
                alt="SSLCommerz"
                style={{ height: '30px', marginRight: '10px' }}
              />
              Secure Payment Gateway
            </Card.Title>
          
          {error && (
            <Alert variant="danger" className="mb-3" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}
          
          {stage === 'PROCESSING' && (
            <div className="text-center p-4">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Processing Your Payment</h5>
              <p className="text-muted">Please wait while we connect to the payment gateway...</p>
            </div>
          )}
          
          {stage === 'REDIRECT' && (
            <div className="text-center p-4">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Redirecting to Payment Gateway</h5>
              <p className="text-muted">If you are not redirected automatically, please click the button below.</p>
              <p className="small">Transaction ID: {transactionId}</p>
              
              <Row className="mt-3">
                <Col>
                  <Button 
                    variant="link" 
                    className="text-danger" 
                    onClick={handleCancel}
                  >
                    Cancel Payment
                  </Button>
                </Col>
                <Col>
                  <Button 
                    variant="primary" 
                    onClick={handleProceedToPayment}
                  >
                    Proceed to Payment
                  </Button>
                </Col>
              </Row>
            </div>
          )}
          
          <div className="text-center mt-3">
            <p className="small text-muted mb-1">Secured by SSLCommerz</p>
            <div className="d-flex justify-content-center align-items-center">
              <img 
                src="https://sandbox.sslcommerz.com/gwprocess/v4/image/gw/visa.png" 
                alt="Visa"
                style={{ height: '25px', margin: '0 5px' }}
              />
              <img 
                src="https://sandbox.sslcommerz.com/gwprocess/v4/image/gw/master.png" 
                alt="Mastercard"
                style={{ height: '25px', margin: '0 5px' }}
              />
              <img 
                src="https://sandbox.sslcommerz.com/gwprocess/v4/image/gw/bkash.png" 
                alt="bKash"
                style={{ height: '25px', margin: '0 5px' }}
              />
              <img 
                src="https://sandbox.sslcommerz.com/gwprocess/v4/image/gw/nagad.png" 
                alt="Nagad"
                style={{ height: '25px', margin: '0 5px' }}
              />
            </div>
          </div>
        </Card.Body>
      </Card>
      )}
      
      {/* Payment Confirmation Modal */}
      <Modal
        show={showConfirmation}
        onHide={() => setShowConfirmation(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header className="bg-success text-white">
          <Modal.Title>
            <FaCheckCircle className="me-2" />
            Payment Confirmation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="text-center mb-4">
            <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
              <FaCheckCircle size={50} className="text-success" />
            </div>
            <h4>Confirm Your Payment</h4>
            <p className="text-muted">You are about to make a payment for:</p>
          </div>
          
          <Card className="mb-3 bg-light">
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Event:</span>
                <span className="fw-bold">{paymentData.product_name}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Amount:</span>
                <span className="fw-bold">৳{paymentData.totalAmount.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Transaction ID:</span>
                <span className="fw-bold">{transactionId}</span>
              </div>
            </Card.Body>
          </Card>
          
          <p className="text-center">You will be redirected to the SSLCommerz payment gateway in <span className="fw-bold text-primary">{redirectCountdown}</span> seconds.</p>
          
          <div className="d-grid gap-2">
            <Button 
              variant="success" 
              size="lg"
              onClick={handleImmediateRedirect}
            >
              Proceed Now
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default SSLCommerzGateway;

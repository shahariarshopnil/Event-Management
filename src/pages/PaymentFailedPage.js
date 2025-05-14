import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaTimesCircle, FaRedo, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Loader from '../components/shared/Loader';
import Message from '../components/shared/Message';

const PaymentFailedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Get payment details from URL
  const queryParams = new URLSearchParams(location.search);
  const transactionId = queryParams.get('tran_id');
  const failReason = queryParams.get('error') || 'The payment was not completed';
  
  // Redux state
  const { userInfo } = useSelector((state) => state.auth);
  
  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    
    // Show failure notification
    toast.error('Payment failed. Please try again.', {
      position: 'top-center',
      autoClose: 5000,
    });
    
  }, [navigate, userInfo]);
  
  // Redirect to home if no transaction data
  useEffect(() => {
    if (!transactionId && !location.state?.from) {
      navigate('/');
    }
  }, [navigate, transactionId, location]);
  
  const goBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else {
      navigate(-1);
    }
  };
  
  const tryAgain = () => {
    // If we have return URL, go there, otherwise just go back
    if (location.state?.returnUrl) {
      navigate(location.state.returnUrl);
    } else {
      navigate('/tickets');
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="border-0 shadow">
            <Card.Body className="text-center p-5">
              <div className="mb-4">
                <FaTimesCircle className="text-danger" style={{ fontSize: '5rem' }} />
              </div>
              
              <h2 className="mb-4">Payment Failed</h2>
              
              <div className="alert alert-danger mb-4">
                {failReason}
              </div>
              
              {transactionId && (
                <div className="payment-details mb-4">
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <strong>Transaction ID:</strong>
                    <span>{transactionId}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <strong>Status:</strong>
                    <span className="text-danger">Failed</span>
                  </div>
                </div>
              )}
              
              <div className="payment-support mb-4">
                <h5>What went wrong?</h5>
                <ul className="text-start">
                  <li>Your card may have been declined</li>
                  <li>You may have insufficient funds</li>
                  <li>There might be an issue with your payment method</li>
                  <li>The transaction timed out</li>
                </ul>
              </div>
              
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={tryAgain}
                  className="mb-2"
                >
                  <FaRedo className="me-2" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline-secondary" 
                  onClick={goBack}
                >
                  <FaArrowLeft className="me-2" />
                  Go Back
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentFailedPage;

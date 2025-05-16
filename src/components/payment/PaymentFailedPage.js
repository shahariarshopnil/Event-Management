import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaTimesCircle, FaArrowLeft, FaRedo } from 'react-icons/fa';

const PaymentFailedPage = () => {
  const location = useLocation();
  
  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const reason = queryParams.get('reason') || 'transaction_failed';
  const transactionId = queryParams.get('transactionId');
  
  // Get event data from state if available
  const { state } = location;
  const event = state?.event;
  const selectedPackage = state?.package;
  
  // Generate appropriate error message based on reason
  const getErrorMessage = (errorReason) => {
    switch (errorReason) {
      case 'validation_failed':
        return 'The payment could not be validated. Please try again or contact support.';
      case 'payment_not_found':
        return 'We could not find a record of your payment. Please try again or contact support.';
      case 'event_not_found':
        return 'The event you were trying to book is no longer available.';
      case 'server_error':
        return 'An error occurred on our servers. Please try again later or contact support.';
      default:
        return 'Your payment was not completed. Please try again or choose another payment method.';
    }
  };
  
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-5 text-center">
              <div className="mb-4">
                <div className="bg-danger text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                  <FaTimesCircle size={40} />
                </div>
                <h1 className="mt-2">Payment Failed</h1>
                <p className="lead text-muted">
                  {getErrorMessage(reason)}
                </p>
              </div>
              
              {transactionId && (
                <div className="alert alert-info mb-4">
                  <strong>Transaction ID:</strong> {transactionId}
                  <div className="mt-2 small">
                    Please save this Transaction ID if you need to contact our support team.
                  </div>
                </div>
              )}
              
              <div className="d-grid gap-3 mt-4">
                {event && (
                  <Button 
                    variant="primary" 
                    as={Link} 
                    to={{
                      pathname: '/checkout',
                      state: { event, package: selectedPackage },
                    }}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <FaRedo className="me-2" />
                    Try Again
                  </Button>
                )}
                
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-secondary" 
                    className="w-50" 
                    as={Link} 
                    to={event ? `/events/${event._id}` : '/events'}
                  >
                    <FaArrowLeft className="me-2" />
                    {event ? 'Back to Event' : 'Explore Events'}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    className="w-50" 
                    as={Link} 
                    to="/contact"
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 text-muted small">
                <p>
                  If you believe this is an error or if your payment was actually completed,
                  please check your email for confirmation or contact our customer support.
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentFailedPage;

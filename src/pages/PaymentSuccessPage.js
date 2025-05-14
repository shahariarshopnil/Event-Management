import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaCheckCircle, FaTicketAlt, FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { fetchPaymentDetails } from '../redux/slices/paymentSlice';
import { getUserBookings } from '../redux/slices/bookingSlice';
import { getEventDetails } from '../redux/slices/eventSlice';
import { getEventPackages } from '../redux/slices/packageSlice';
import Loader from '../components/shared/Loader';
import Message from '../components/shared/Message';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const queryParams = new URLSearchParams(location.search);
  
  // Get payment details from URL
  const transactionId = queryParams.get('tran_id');
  const status = queryParams.get('status');
  const amount = queryParams.get('amount');
  const currency = queryParams.get('currency');
  const eventId = queryParams.get('event_id');
  const packageId = queryParams.get('package_id');
  const quantity = queryParams.get('quantity');
  
  // Redux state
  const { userInfo } = useSelector((state) => state.auth);
  const { loading, error, paymentDetails } = useSelector((state) => state.payment);
  const { events } = useSelector((state) => state.events);
  const { packages } = useSelector((state) => state.packages);
  
  // Local state
  const [event, setEvent] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    
    // Only verify payment if we have a transaction ID
    if (transactionId && status === 'VALID') {
      // Fetch payment details using transaction ID
      dispatch(fetchPaymentDetails(transactionId));
      
      // Show success notification
      toast.success('Payment successful! Your booking is confirmed.', {
        position: 'top-center',
        autoClose: 5000,
      });
      
      // Also fetch updated bookings
      dispatch(getUserBookings());
      
      // Get event details
      if (eventId) {
        dispatch(getEventDetails(eventId));
        dispatch(getEventPackages(eventId));
      }
    }
  }, [dispatch, navigate, transactionId, status, userInfo]);
  
  // Redirect to home if no transaction data
  useEffect(() => {
    if (!transactionId) {
      navigate('/');
    }
  }, [navigate, transactionId]);
  
  // Find event and package from loaded data
  useEffect(() => {
    if (events && events.length > 0 && eventId) {
      const foundEvent = events.find(e => e._id === eventId) || events.find(e => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
      }
    }
    
    if (packages && packages.length > 0 && packageId) {
      const foundPackage = packages.find(p => p._id === packageId) || packages.find(p => p.id === packageId);
      if (foundPackage) {
        setSelectedPackage(foundPackage);
      }
    }
  }, [events, packages, eventId, packageId]);
  
  const goToBookings = () => {
    // Add transaction ID as query param to highlight this booking
    navigate(`/bookings?highlight_tran=${transactionId}`);
  };
  
  const goToEvents = () => {
    navigate('/events');
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Message variant="danger">{error}</Message>;
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="border-0 shadow">
            <Card.Header className="bg-success text-white p-4">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <FaCheckCircle style={{ fontSize: '3rem' }} />
                </div>
                <div>
                  <h2 className="mb-0">Payment Successful!</h2>
                  <p className="mb-0 mt-1">Your booking has been confirmed</p>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="payment-confirmation mb-4 p-3 bg-light rounded">
                <div className="d-flex align-items-center mb-3">
                  <FaTicketAlt className="text-success me-2" size={24} />
                  <h4 className="mb-0">Booking Confirmation</h4>
                </div>
                <p>Your payment has been processed successfully and your booking is now confirmed.</p>
                <p className="mb-0">A confirmation email has been sent to your registered email address.</p>
              </div>
              
              <Row className="mb-4">
                <Col md={6}>
                  <div className="border rounded p-3 h-100">
                    <h5 className="border-bottom pb-2">Payment Details</h5>
                    <div className="d-flex justify-content-between py-2">
                      <strong>Transaction ID:</strong>
                      <span className="text-monospace">{transactionId}</span>
                    </div>
                    <div className="d-flex justify-content-between py-2">
                      <strong>Amount Paid:</strong>
                      <span className="fw-bold">{currency} {amount}</span>
                    </div>
                    <div className="d-flex justify-content-between py-2">
                      <strong>Payment Status:</strong>
                      <span className="badge bg-success">Confirmed</span>
                    </div>
                    <div className="d-flex justify-content-between py-2">
                      <strong>Payment Method:</strong>
                      <span>Mobile Banking</span>
                    </div>
                    <div className="d-flex justify-content-between py-2">
                      <strong>Payment Date:</strong>
                      <span>{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </Col>
                
                <Col md={6}>
                  <div className="border rounded p-3 h-100">
                    <h5 className="border-bottom pb-2">Booking Details</h5>
                    <div className="d-flex justify-content-between py-2">
                      <strong>Event:</strong>
                      <span>{event?.title || paymentDetails?.event?.title || "Your Event"}</span>
                    </div>
                    <div className="d-flex justify-content-between py-2">
                      <strong>Package:</strong>
                      <span>{selectedPackage?.name || paymentDetails?.package?.name || "Standard Ticket"}</span>
                    </div>
                    <div className="d-flex justify-content-between py-2">
                      <strong>Quantity:</strong>
                      <span>{quantity || 1}</span>
                    </div>
                    <div className="d-flex justify-content-between py-2">
                      <strong>Booking ID:</strong>
                      <span className="text-monospace">{paymentDetails?.bookingId || `BK-${transactionId?.substring(6, 12)}`}</span>
                    </div>
                    <div className="d-flex justify-content-between py-2">
                      <strong>Status:</strong>
                      <span className="badge bg-success">Confirmed</span>
                    </div>
                  </div>
                </Col>
              </Row>
              
              <div className="p-3 border rounded mb-4 bg-light">
                <h5>What's Next?</h5>
                <ul className="mb-0">
                  <li>You will receive an email with your e-tickets shortly</li>
                  <li>You can view your bookings in your account dashboard</li>
                  <li>For any questions, please contact our support team</li>
                </ul>
              </div>
              
              <div className="d-flex justify-content-between">
                <Button 
                  variant="primary" 
                  onClick={goToBookings}
                  className="px-4"
                >
                  <FaTicketAlt className="me-2" />
                  View My Bookings
                </Button>
                
                <Button 
                  variant="outline-primary" 
                  onClick={goToEvents}
                >
                  <FaArrowRight className="me-2" />
                  Browse More Events
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentSuccessPage;

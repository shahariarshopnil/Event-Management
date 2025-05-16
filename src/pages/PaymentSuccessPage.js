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
    <Container>
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body className="text-center p-5">
              <FaCheckCircle className="text-success mb-4" size={60} />
              <h2 className="mb-4">Payment Successful!</h2>
              <p className="lead mb-4">
                Your payment of {currency} {amount} has been processed successfully.
              </p>
              {event && (
                <div className="mb-4">
                  <h4>{event.name}</h4>
                  {selectedPackage && (
                    <p className="text-muted">
                      Package: {selectedPackage.name} x {quantity}
                    </p>
                  )}
                </div>
              )}
              <div className="d-grid gap-3 d-md-flex justify-content-md-center">
                <Button variant="primary" onClick={goToBookings}>
                  <FaTicketAlt className="me-2" /> View My Bookings
                </Button>
                <Button variant="outline-primary" onClick={goToEvents}>
                  <FaArrowRight className="me-2" /> Browse More Events
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

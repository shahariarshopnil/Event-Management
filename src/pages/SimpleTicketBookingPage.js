import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Form, Button, Card, Badge, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt } from 'react-icons/fa';
import { getEventDetails } from '../redux/slices/eventSlice';
import { getEventPackages } from '../redux/slices/packageSlice';
import { createBooking } from '../redux/slices/bookingSlice';
import { initiatePayment, resetPaymentState } from '../redux/slices/paymentSlice';
import SSLCommerzGateway from '../components/payment/SSLCommerzGateway';
import BookingButton from '../components/buttons/BookingButton';
import Loader from '../components/shared/Loader';
import Message from '../components/shared/Message';

const SimpleTicketBookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Get package ID from URL query if available
  const queryParams = new URLSearchParams(location.search);
  const preSelectedPackageId = queryParams.get('package');

  // Redux state
  const { event, loading: eventLoading } = useSelector((state) => state.events);
  const { packages, loading: packagesLoading } = useSelector((state) => state.packages);
  const { userInfo } = useSelector((state) => state.auth);
  const { loading: bookingLoading, error: bookingError, success: bookingSuccess } = useSelector((state) => state.bookings);
  const { loading: paymentLoading, error: paymentError, success: paymentSuccess, redirectUrl } = useSelector((state) => state.payment);

  // Local state
  const [selectedPackageId, setSelectedPackageId] = useState(preSelectedPackageId || '');
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState(null);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState(null);

  // Fetch event and packages
  useEffect(() => {
    if (!userInfo) {
      toast.info('Please login to book tickets');
      navigate('/login');
      return;
    }

    dispatch(getEventDetails(id));
    dispatch(getEventPackages(id));
    
    // If package ID is provided in URL, set it when packages are loaded
    if (preSelectedPackageId) {
      console.log('Pre-selected package ID from URL:', preSelectedPackageId);
      setSelectedPackageId(preSelectedPackageId);
    }
  }, [dispatch, id, userInfo, navigate, preSelectedPackageId]);

  // Handle booking success
  useEffect(() => {
    if (bookingSuccess) {
      toast.success('Booking completed successfully!');
      navigate('/bookings');
    }
  }, [bookingSuccess, navigate]);
  
  // Handle payment status changes
  useEffect(() => {
    if (paymentSuccess) {
      console.log('Payment successfully initiated');
      setPaymentInitiated(true);
    }
    
    if (paymentError) {
      toast.error(paymentError || 'Payment initiation failed');
      setPaymentInitiated(false);
    }
  }, [paymentSuccess, paymentError]);
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      dispatch(resetPaymentState());
    };
  }, [dispatch]);

  // Get selected package and calculate price
  const selectedPackage = packages?.find(pkg => pkg._id === selectedPackageId);
  const totalPrice = selectedPackage ? selectedPackage.price * numberOfTickets : 0;

  // Handle booking submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedPackageId) {
      toast.error('Please select a ticket package');
      return;
    }
    
    if (numberOfTickets < 1) {
      toast.error('Please select at least 1 ticket');
      return;
    }
    
    if (!agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    
    // Prepare payment data
    const paymentData = {
      eventId: id,
      packageId: selectedPackageId,
      quantity: numberOfTickets,
      totalAmount: totalPrice,
      currency: 'BDT',
      // Add user details from Redux store
      cus_name: userInfo.name,
      cus_email: userInfo.email,
      cus_phone: userInfo.phone || '01700000000',
      // Add product details
      product_name: selectedPackage ? `${event.title} - ${selectedPackage.name}` : event.title,
      product_category: 'Event Ticket'
    };
    
    // Set the payment form data and show payment gateway
    setPaymentFormData(paymentData);
    setShowPaymentGateway(true);
    
    console.log('Preparing payment with data:', paymentData);
  };

  // Loading state
  if (eventLoading || packagesLoading) {
    return <Loader />;
  }

  if (!event) {
    return <Message variant="info">Event not found</Message>;
  }

  return (
    <Container className="py-4">
      <Button 
        variant="outline-secondary" 
        className="mb-3" 
        onClick={() => navigate(`/events/${id}`)}
      >
        <FaArrowLeft className="me-2" /> Back to Event
      </Button>
      
      <h1 className="mb-2">{event.title}</h1>
      <div className="mb-4 d-flex align-items-center gap-3">
        <Badge bg="primary" className="p-2">
          <FaCalendarAlt className="me-1" /> {new Date(event.date).toLocaleDateString()}
        </Badge>
        <Badge bg="info" className="p-2">
          <FaMapMarkerAlt className="me-1" /> {event.location}
        </Badge>
        <Badge bg="success" className="p-2">
          <FaTicketAlt className="me-1" /> {event.availableSlots} spots left
        </Badge>
      </div>

      {bookingError && <Message variant="danger">{bookingError}</Message>}
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Select Package</Form.Label>
                  {packages && packages.length > 0 ? (
                    packages.map((pkg) => (
                      <div key={pkg._id} className="mb-2">
                        <Card 
                          className={`p-2 ${selectedPackageId === pkg._id ? 'border-primary shadow-sm' : ''}`}
                          onClick={() => {
                            console.log('Selected package with ID:', pkg._id);
                            setSelectedPackageId(pkg._id);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-0">{pkg.name}</h6>
                              <small className="text-muted">{pkg.description}</small>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold">৳{pkg.price.toFixed(2)}</div>
                              <Form.Check
                                type="radio"
                                id={`package-${pkg._id}`}
                                name="package"
                                checked={selectedPackageId === pkg._id}
                                onChange={() => setSelectedPackageId(pkg._id)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-3 bg-light rounded">
                      <p className="mb-0">No packages available for this event</p>
                    </div>
                  )}
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Number of Tickets</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max={selectedPackage ? selectedPackage.availableBookings : 10}
                    value={numberOfTickets}
                    onChange={(e) => setNumberOfTickets(parseInt(e.target.value))}
                    disabled={!selectedPackageId}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Special Requirements</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                placeholder="Optional: Any dietary restrictions, accessibility needs, etc."
              />
            </Form.Group>

            {selectedPackage && (
              <div className="p-3 bg-light rounded mb-3">
                <h5>Order Summary</h5>
                <div className="d-flex justify-content-between mb-2">
                  <span>{selectedPackage.name} x {numberOfTickets}</span>
                  <span>৳{(selectedPackage.price * numberOfTickets).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold">
                  <span>Total</span>
                  <span>৳{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="I agree to the terms and conditions"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                required
              />
            </Form.Group>

            {showPaymentGateway && paymentFormData ? (
              <SSLCommerzGateway 
                paymentData={paymentFormData}
                onPaymentInitiated={(data) => {
                  setPendingTransactionId(data.transactionId);
                  setPaymentInitiated(true);
                  toast.info('Your payment is being processed');
                }}
                onPaymentCancelled={() => {
                  setShowPaymentGateway(false);
                  toast.info('Payment cancelled');
                }}
              />
            ) : (
              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                className="w-100"
                disabled={bookingLoading || paymentLoading || !selectedPackageId}
              >
                <FaTicketAlt className="me-2" />
                {`Complete Booking - ৳${totalPrice.toFixed(2)}`}
              </Button>
            )}
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SimpleTicketBookingPage;

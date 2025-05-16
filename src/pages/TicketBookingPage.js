import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaTicketAlt,
  FaCreditCard,
  FaArrowLeft,
  FaCheck
} from 'react-icons/fa';
import { getEventDetails } from '../redux/slices/eventSlice';
import { getEventPackages } from '../redux/slices/packageSlice';
import { createBooking } from '../redux/slices/bookingSlice';
import Loader from '../components/shared/Loader';
import Message from '../components/shared/Message';

const TicketBookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Get package ID from URL query params if available
  const queryParams = new URLSearchParams(location.search);
  const preSelectedPackageId = queryParams.get('package');
  
  // Redux state
  const { event, loading: eventLoading, error: eventError } = useSelector((state) => state.events);
  const { packages, loading: packagesLoading } = useSelector((state) => state.packages);
  const { userInfo } = useSelector((state) => state.auth);
  const { success: bookingSuccess, loading: bookingLoading, error: bookingError } = useSelector((state) => state.bookings);
  
  // Local state for booking form
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // Selected package object
  const selectedPackage = packages?.find(pkg => pkg._id === selectedPackageId);
  
  // Calculate total price
  const totalPrice = selectedPackage ? selectedPackage.price * numberOfTickets : 0;
  
  // Fetch event details and packages
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!userInfo) {
      toast.info('Please login to book tickets');
      navigate('/login');
      return;
    }
    
    dispatch(getEventDetails(id));
    dispatch(getEventPackages(id));
    
    // Set preselected package if available in URL
    if (preSelectedPackageId) {
      setSelectedPackageId(preSelectedPackageId);
    }
  }, [dispatch, id, userInfo, navigate, preSelectedPackageId]);
  
  // Handle successful booking
  useEffect(() => {
    if (bookingSuccess) {
      toast.success('Booking completed successfully!');
      navigate('/bookings');
    }
  }, [bookingSuccess, navigate]);
  
  // Handle booking submission
  const handleBookTicket = () => {
    // Validate form
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
    
    // Create booking
    const bookingData = {
      event: id,
      package: selectedPackageId,
      numberOfTickets,
      paymentMethod: 'credit_card', // Default to credit card
      specialRequirements
    };
    
    // Dispatch booking action
    dispatch(createBooking(bookingData));
  };
  
  // Render loading or error state
  if (eventLoading || packagesLoading) {
    return <Loader />;
  }
  
  if (eventError) {
    return <Message variant="danger">{eventError}</Message>;
  }
  
  if (!event) {
    return <Message variant="info">Event not found</Message>;
  }
  
  return (
    <Container className="py-5">
      <Button 
        variant="outline-secondary" 
        className="mb-4" 
        onClick={() => navigate(`/events/${id}`)}
      >
        <FaArrowLeft className="me-2" /> Back to Event
      </Button>
      
      <h1 className="mb-4">Book Tickets: {event.title}</h1>
      
      {bookingError && (
        <Alert variant="danger" className="mb-4">
          {bookingError}
        </Alert>
      )}
      
      <Row>
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h4 className="mb-0">Booking Process</h4>
            </Card.Header>
            <Card.Body>
              <div className="booking-steps mb-4">
                <div className={`booking-step ${step >= 1 ? 'active' : ''}`}>
                  <div className="step-number">1</div>
                  <div className="step-label">Select Package</div>
                </div>
                <div className="booking-step-connector"></div>
                <div className={`booking-step ${step >= 2 ? 'active' : ''}`}>
                  <div className="step-number">2</div>
                  <div className="step-label">Attendee Info</div>
                </div>
                <div className="booking-step-connector"></div>
                <div className={`booking-step ${step >= 3 ? 'active' : ''}`}>
                  <div className="step-number">3</div>
                  <div className="step-label">Payment</div>
                </div>
                <div className="booking-step-connector"></div>
                <div className={`booking-step ${step >= 4 ? 'active' : ''}`}>
                  <div className="step-number">4</div>
                  <div className="step-label">Confirmation</div>
                </div>
              </div>
              
              <Form onSubmit={handleSubmit}>
                {/* Step 1: Package Selection */}
                {step === 1 && (
                  <>
                    <h5 className="mb-3">Select Ticket Package</h5>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>Number of Tickets</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text"><FaTicketAlt /></span>
                        <Form.Control
                          type="number"
                          min="1"
                          max={event.availableSlots}
                          value={numberOfTickets}
                          onChange={(e) => setNumberOfTickets(parseInt(e.target.value))}
                          required
                        />
                      </div>
                      <Form.Text className="text-muted">
                        {event.availableSlots} tickets available
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>Select Package</Form.Label>
                      <div className="packages-list">
                        {packages.map(pkg => (
                          <Card 
                            key={pkg._id} 
                            className={`mb-3 package-card ${selectedPackage === pkg._id ? 'selected' : ''}`}
                            onClick={() => setSelectedPackage(pkg._id)}
                          >
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <h5 className="mb-0">{pkg.name}</h5>
                                <Badge bg="primary">৳{pkg.price.toFixed(2)}</Badge>
                              </div>
                              <p className="mb-3 text-muted">{pkg.description}</p>
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="text-muted small">
                                  <FaTicketAlt className="me-1" />
                                  {pkg.availableBookings} available
                                </div>
                                <Form.Check
                                  type="radio"
                                  name="packageSelection"
                                  checked={selectedPackage === pkg._id}
                                  onChange={() => setSelectedPackage(pkg._id)}
                                  disabled={pkg.availableBookings < numberOfTickets}
                                />
                              </div>
                              {pkg.availableBookings < numberOfTickets && (
                                <div className="text-danger small mt-2">
                                  <FaInfoCircle className="me-1" />
                                  Not enough tickets available
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    </Form.Group>
                    
                    <div className="d-grid">
                      <Button type="submit" variant="primary" size="lg">
                        Continue to Attendee Information
                      </Button>
                    </div>
                  </>
                )}
                
                {/* Step 2: Attendee Information */}
                {step === 2 && (
                  <>
                    <h5 className="mb-3">Attendee Information</h5>
                    
                    {attendeeInfo.map((attendee, index) => (
                      <Card className="mb-3" key={index}>
                        <Card.Header className="bg-white">
                          <h6 className="mb-0">Attendee {index + 1} {index === 0 && '(You)'}</h6>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Full Name</Form.Label>
                                <Form.Control
                                  type="text"
                                  placeholder="Enter full name"
                                  value={attendee.name}
                                  onChange={(e) => handleAttendeeChange(index, 'name', e.target.value)}
                                  required
                                  disabled={index === 0} // Disable for the primary attendee (user)
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                  type="email"
                                  placeholder="Enter email"
                                  value={attendee.email}
                                  onChange={(e) => handleAttendeeChange(index, 'email', e.target.value)}
                                  required
                                  disabled={index === 0} // Disable for the primary attendee (user)
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                    
                    <Form.Group className="mb-4">
                      <Form.Label>Special Requirements (Optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Any special requirements or requests for this booking"
                        value={specialRequirements}
                        onChange={(e) => setSpecialRequirements(e.target.value)}
                      />
                    </Form.Group>
                    
                    <div className="d-flex justify-content-between">
                      <Button variant="outline-secondary" onClick={() => setStep(1)}>
                        Back to Package Selection
                      </Button>
                      <Button type="submit" variant="primary">
                        Continue to Payment
                      </Button>
                    </div>
                  </>
                )}
                
                {/* Step 3: Payment Information */}
                {step === 3 && (
                  <>
                    <h5 className="mb-3">Payment Information</h5>
                    
                    <Alert variant="info" className="d-flex align-items-start mb-4">
                      <FaInfoCircle className="me-2 mt-1" size={20} />
                      <div>
                        <strong>Test Payment Mode:</strong> No actual payment will be processed.
                        Select your preferred payment method to continue.
                      </div>
                    </Alert>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>Payment Method</Form.Label>
                      <div className="payment-methods">
                        <Card 
                          className={`mb-3 payment-method-card ${paymentMethod === 'credit_card' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('credit_card')}
                        >
                          <Card.Body className="d-flex align-items-center">
                            <FaCreditCard className="me-3 text-primary" size={24} />
                            <div>
                              <h6 className="mb-0">Credit/Debit Card</h6>
                              <small className="text-muted">Pay securely using your card</small>
                            </div>
                            <Form.Check
                              type="radio"
                              name="paymentMethod"
                              className="ms-auto"
                              checked={paymentMethod === 'credit_card'}
                              onChange={() => setPaymentMethod('credit_card')}
                            />
                          </Card.Body>
                        </Card>
                        
                        <Card 
                          className={`mb-3 payment-method-card ${paymentMethod === 'bank_transfer' ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod('bank_transfer')}
                        >
                          <Card.Body className="d-flex align-items-center">
                            <FaMoneyBillWave className="me-3 text-success" size={24} />
                            <div>
                              <h6 className="mb-0">Bank Transfer</h6>
                              <small className="text-muted">Pay using direct bank transfer</small>
                            </div>
                            <Form.Check
                              type="radio"
                              name="paymentMethod"
                              className="ms-auto"
                              checked={paymentMethod === 'bank_transfer'}
                              onChange={() => setPaymentMethod('bank_transfer')}
                            />
                          </Card.Body>
                        </Card>
                      </div>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Check
                        type="checkbox"
                        id="termsCheck"
                        label="I accept the terms and conditions"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        required
                      />
                    </Form.Group>
                    
                    <div className="d-flex justify-content-between">
                      <Button variant="outline-secondary" onClick={() => setStep(2)}>
                        Back to Attendee Info
                      </Button>
                      <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={bookingLoading}
                      >
                        {bookingLoading ? 'Processing...' : 'Complete Booking'}
                      </Button>
                    </div>
                    
                    {bookingError && (
                      <Alert variant="danger" className="mt-3">
                        {bookingError}
                      </Alert>
                    )}
                  </>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          {/* Order Summary */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Booking Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="event-details mb-4">
                <h6>{event.title}</h6>
                <div className="d-flex align-items-center text-muted mb-2">
                  <FaCalendarAlt className="me-2" />
                  {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="d-flex align-items-center text-muted mb-2">
                  <FaClock className="me-2" />
                  {event.time}
                </div>
                <div className="d-flex align-items-center text-muted">
                  <FaMapMarkerAlt className="me-2" />
                  {event.location}, {event.city}
                </div>
              </div>
              
              <hr />
              
              <ListGroup variant="flush" className="mb-3">
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <div>
                    <strong>Package:</strong> {selectedPackage ? 
                      packages.find(p => p._id === selectedPackage)?.name : 'Standard Ticket'}
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <div>
                    <strong>Quantity:</strong> {numberOfTickets} {numberOfTickets > 1 ? 'tickets' : 'ticket'}
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <div>
                    <strong>Price per ticket:</strong>
                  </div>
                  <div>
                    ৳{selectedPackage 
                      ? packages.find(p => p._id === selectedPackage)?.price.toFixed(2) 
                      : event.price.toFixed(2)}
                  </div>
                </ListGroup.Item>
              </ListGroup>
              
              <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                <h5 className="mb-0">Total:</h5>
                <h5 className="mb-0">৳{calculateTotalPrice().toFixed(2)}</h5>
              </div>
            </Card.Body>
          </Card>
          
          {/* Event Organizer */}
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Organizer</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  {event.organizer?.profileImage ? (
                    <img 
                      src={`http://localhost:5000/uploads/profiles/${event.organizer.profileImage}`} 
                      alt={event.organizer.name} 
                      className="rounded-circle"
                      style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                      style={{ width: '60px', height: '60px' }}
                    >
                      <FaUser size={24} />
                    </div>
                  )}
                </div>
                <div>
                  <h6 className="mb-1">{event.organizer?.name}</h6>
                  <div className="text-muted small">
                    {event.organizer?.email}
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Add custom CSS for the booking steps */}
      <style jsx="true">{`
        .booking-steps {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }
        
        .booking-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
        }
        
        .step-number {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background-color: #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
          font-weight: bold;
          color: #6c757d;
          transition: all 0.3s;
        }
        
        .booking-step.active .step-number {
          background-color: #0d6efd;
          color: white;
        }
        
        .step-label {
          font-size: 0.875rem;
          color: #6c757d;
          text-align: center;
        }
        
        .booking-step.active .step-label {
          color: #0d6efd;
          font-weight: 500;
        }
        
        .booking-step-connector {
          height: 2px;
          background-color: #e9ecef;
          flex: 1;
          margin: 0 0.5rem;
          margin-bottom: 2rem;
        }
        
        .package-card {
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #dee2e6;
        }
        
        .package-card:hover, .payment-method-card:hover {
          border-color: #0d6efd;
          box-shadow: 0 0.125rem 0.25rem rgba(13, 110, 253, 0.1);
        }
        
        .package-card.selected, .payment-method-card.selected {
          border-color: #0d6efd;
          border-width: 2px;
          box-shadow: 0 0.125rem 0.25rem rgba(13, 110, 253, 0.2);
        }
        
        .payment-method-card {
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #dee2e6;
        }
      `}</style>
    </Container>
  );
};

export default TicketBookingPage;

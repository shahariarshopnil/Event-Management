import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaLock, FaCreditCard, FaMobileAlt, FaMoneyBill, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import { initiatePayment, resetPaymentState } from '../../redux/slices/paymentSlice';
import { toast } from 'react-toastify';

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from location state (passed from event details page)
  const { event, package: selectedPackage } = location.state || {};
  
  // Debug state data
  useEffect(() => {
    console.log('location.state:', location.state);
    console.log('selectedPackage:', selectedPackage);
    console.log('event:', event);
  }, [location.state, selectedPackage, event]);
  
  // Get user authentication and payment state from Redux
  const { userInfo } = useSelector((state) => state.auth);
  const { loading, error, success, redirectUrl } = useSelector((state) => state.payment);
  
  // Component state
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [currency, setCurrency] = useState('BDT');
  const [agreed, setAgreed] = useState(false);
  
  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (!userInfo) {
      toast.warning('Please log in to proceed with payment');
      navigate('/login', { state: { from: location.pathname } });
    }
    
    // Check if event and package details are available
    if (!event) {
      toast.error('Event information is missing');
      navigate('/events');
    }
    
    // Clean up on component unmount
    return () => {
      dispatch(resetPaymentState());
    };
  }, [userInfo, event, dispatch, navigate, location]);
  
  // Handle payment redirect when payment is initialized successfully
  useEffect(() => {
    if (success && redirectUrl) {
      // Open the payment gateway URL in the same window
      window.location.href = redirectUrl;
    }
  }, [success, redirectUrl]);
  
  // Calculate payment summary
  const calculateTotal = () => {
    // All events are now paid - minimum price is 1
    const itemPrice = selectedPackage ? selectedPackage.price : event?.price || 1;
    const subtotal = itemPrice * quantity;
    const processingFee = Math.round(subtotal * 0.025); // 2.5% processing fee
    const total = subtotal + processingFee;
    
    return {
      itemPrice,
      subtotal,
      processingFee,
      total
    };
  };
  
  const { itemPrice, subtotal, processingFee, total } = calculateTotal();
  
  // Handle checkout form submission
  const handleCheckout = (e) => {
    e.preventDefault();
    
    if (!userInfo) {
      toast.error('Please log in to continue');
      navigate('/login');
      return;
    }
    
    if (!event) {
      toast.error('No event selected for checkout');
      navigate('/events');
      return;
    }
    
    if (!agreed) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    console.log('Processing checkout for package:', selectedPackage);
    
    // Calculate total amount
    const eventPrice = selectedPackage ? selectedPackage.price : event.price;
    const totalAmount = eventPrice * quantity;
    
    // Prepare payment data
    const paymentData = {
      eventId: event._id,
      packageId: selectedPackage ? selectedPackage._id : null,
      quantity: quantity, // Changed from numberOfTickets to quantity to match backend
      totalAmount,
      paymentMethod,
      currency,
    };
    
    console.log('Payment data:', paymentData);
    
    // Initiate payment process
    dispatch(initiatePayment(paymentData));
  };
  
  // Render loading state
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Initializing payment, please wait...</p>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <h1 className="mb-4">Checkout</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col md={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-white">
              <h3 className="mb-0 h5">Payment Information</h3>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleCheckout}>
                <h4 className="mb-3">Select Payment Method</h4>
                
                <div className="mb-4">
                  <Form.Check
                    type="radio"
                    id="card"
                    name="paymentMethod"
                    label={
                      <div className="d-flex align-items-center">
                        <FaCreditCard className="text-primary me-2" />
                        <span>Credit/Debit Card</span>
                      </div>
                    }
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mb-2"
                  />
                  
                  <Form.Check
                    type="radio"
                    id="mobile"
                    name="paymentMethod"
                    label={
                      <div className="d-flex align-items-center">
                        <FaMobileAlt className="text-primary me-2" />
                        <span>Mobile Banking</span>
                      </div>
                    }
                    value="mobile"
                    checked={paymentMethod === 'mobile'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mb-2"
                  />
                  
                  <Form.Check
                    type="radio"
                    id="bank"
                    name="paymentMethod"
                    label={
                      <div className="d-flex align-items-center">
                        <FaMoneyBill className="text-primary me-2" />
                        <span>Net Banking</span>
                      </div>
                    }
                    value="bank"
                    checked={paymentMethod === 'bank'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                </div>
                
                <h4 className="mb-3">Ticket Quantity</h4>
                <Form.Group className="mb-4">
                  <div className="d-flex align-items-center">
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <Form.Control 
                      type="number" 
                      min="1" 
                      max={selectedPackage ? selectedPackage.availableBookings : 10}
                      value={quantity} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        const max = selectedPackage ? selectedPackage.availableBookings : 10;
                        if (!isNaN(val) && val >= 1 && val <= max) {
                          setQuantity(val);
                        }
                      }}
                      className="mx-2 text-center"
                    />
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => {
                        const max = selectedPackage ? selectedPackage.availableBookings : 10;
                        if (quantity < max) {
                          setQuantity(quantity + 1);
                        }
                      }}
                      disabled={selectedPackage && quantity >= selectedPackage.availableBookings}
                    >
                      +
                    </Button>
                  </div>
                  {selectedPackage && (
                    <small className="text-muted mt-1 d-block">
                      Maximum available: {selectedPackage.availableBookings} tickets
                    </small>
                  )}
                </Form.Group>
                
                <h4 className="mb-3">Currency</h4>
                <Form.Group className="mb-4">
                  <Form.Select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="BDT">BDT (Bangladeshi Taka)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </Form.Select>
                </Form.Group>
                
                <div className="mb-4">
                  <Form.Check
                    type="checkbox"
                    id="terms"
                    label="I agree to the terms and conditions"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mb-2"
                  />
                </div>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    size="lg"
                    disabled={!agreed || loading}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaLock className="me-2" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
          
          <div className="text-center mt-3">
            <img 
              src="https://securepay.sslcommerz.com/public/image/SSLCommerz-Pay-With-logo-All-Size-01.png" 
              alt="SSLCommerz Payment" 
              style={{ maxWidth: '100%', height: '40px' }}
            />
            <p className="text-muted mt-2 small">
              Your payment is processed securely by SSLCommerz
            </p>
          </div>
        </Col>
        
        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-white">
              <h3 className="mb-0 h5">Order Summary</h3>
            </Card.Header>
            <Card.Body>
              {/* Event and Package Details */}
              <div className="mb-4">
                <h6 className="text-primary mb-3">{event.title}</h6>
                <div className="d-flex align-items-center mb-2">
                  <FaCalendarAlt className="text-muted me-2" />
                  <small>
                    {format(new Date(event.date), 'PPP')} at {event.time}
                  </small>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <FaMapMarkerAlt className="text-muted me-2" />
                  <small>{event.location}, {event.city}</small>
                </div>

                {selectedPackage && (
                  <div className="mb-3 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">{selectedPackage.name} Package</h6>
                      <Badge bg="primary">${selectedPackage.price.toFixed(2)}</Badge>
                    </div>
                    <small className="text-muted d-block mb-2">{selectedPackage.description}</small>
                    {selectedPackage.features && selectedPackage.features.length > 0 && (
                      <ul className="small ps-3 mb-0">
                        {selectedPackage.features.slice(0, 3).map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                        {selectedPackage.features.length > 3 && (
                          <li>+{selectedPackage.features.length - 3} more features</li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Price Calculation */}
              <div className="d-flex justify-content-between mb-2">
                <span>Ticket Price:</span>
                <span>${itemPrice.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Quantity:</span>
                <span>{quantity}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Processing Fee:</span>
                <span>${processingFee.toFixed(2)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>Total:</strong>
                <strong className="text-primary">${total.toFixed(2)}</strong>
              </div>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="terms"
                  label="I agree to the terms and conditions"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  required
                />
              </Form.Group>

              <Button
                variant="primary"
                size="lg"
                className="w-100"
                type="submit"
                disabled={!agreed}
              >
                <FaLock className="me-2" /> Proceed to Payment
              </Button>

              <div className="text-center mt-3">
                <small className="text-muted">
                  Your payment is secured by SSLCommerz, the leading payment gateway in Bangladesh.
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;

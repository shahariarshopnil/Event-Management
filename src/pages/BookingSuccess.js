import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, ListGroup, Badge } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt, FaDownload, FaShareAlt, FaCheckCircle, FaEnvelope } from 'react-icons/fa';
// Remove QRCode import for now as we don't have the package
// import QRCode from 'qrcode.react';

import { getBookingById } from '../redux/slices/bookingSlice';
import Footer from '../components/layout/Footer';

const BookingSuccess = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { booking, loading, error } = useSelector((state) => state.booking);
  const { userInfo } = useSelector((state) => state.auth);
  
  const [showCode, setShowCode] = useState(false);
  
  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    
    if (bookingId) {
      dispatch(getBookingById(bookingId));
    }
  }, [dispatch, bookingId, userInfo, navigate]);
  
  const downloadTicket = () => {
    // In a real implementation, this would generate a PDF ticket
    alert('Download ticket feature will be implemented in the future');
  };
  
  const shareTicket = () => {
    // In a real implementation, this would share the ticket via email/message
    if (navigator.share) {
      navigator.share({
        title: `Ticket for ${booking?.event?.title || 'Event'}`,
        text: `I've booked tickets for ${booking?.event?.title || 'an event'}! Join me!`,
        url: window.location.href,
      })
      .catch(error => {
        console.error('Error sharing:', error);
      });
    } else {
      alert('Share functionality is not supported on this browser');
    }
  };
  
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger" className="mb-4">
          <h4>Error</h4>
          <p>{error || 'An unexpected error occurred'}</p>
        </Alert>
        <Link to="/">
          <Button variant="primary">Go Back to Home</Button>
        </Link>
      </Container>
    );
  }
  
  if (!booking) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger" className="mb-4">
          <h4>Error</h4>
          <p>Booking not found</p>
        </Alert>
        <Link to="/">
          <Button variant="primary">Go Back to Home</Button>
        </Link>
      </Container>
    );
  }
  
  return (
    <>
      <Container className="py-5">
        <div className="text-center mb-5">
          <div className="d-inline-block rounded-circle bg-success bg-opacity-10 p-3 mb-3">
            <FaCheckCircle className="text-success" size={50} />
          </div>
          <h2>Booking Confirmed!</h2>
          <p className="text-muted">Your payment was successful and your tickets are ready.</p>
        </div>
        
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow border-0 mb-4">
              <Card.Header className="bg-primary text-white py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Digital Ticket</h5>
                  <Badge bg="light" text="dark">#{booking._id.slice(-6)}</Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <h4 className="mb-3">{booking.event?.title}</h4>
                
                <div className="d-flex align-items-center mb-3">
                  <FaCalendarAlt className="text-muted me-2" />
                  <div>
                    <div>{booking.event?.date ? format(new Date(booking.event.date), 'PPP') : 'Date not available'}</div>
                    <small className="text-muted">{booking.event?.time || 'Time not specified'}</small>
                  </div>
                </div>
                
                <div className="d-flex align-items-center mb-4">
                  <FaMapMarkerAlt className="text-muted me-2" />
                  <div>
                    <div>{booking.event?.location || 'Location not specified'}</div>
                    <small className="text-muted">{booking.event?.city || ''}</small>
                  </div>
                </div>
                
                <hr className="my-4" />
                
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <strong>Package</strong>
                    <div>{booking.package?.name || 'Standard Entry'}</div>
                  </div>
                  <div className="text-end">
                    <strong>Tickets</strong>
                    <div>{booking.numberOfTickets} x ${booking.package?.price || booking.event?.price || 0}</div>
                  </div>
                </div>
                
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <strong>Attendee</strong>
                    <div>{userInfo.name}</div>
                  </div>
                  <div className="text-end">
                    <strong>Total Paid</strong>
                    <div className="text-primary">${booking.totalAmount?.toFixed(2) || '0.00'}</div>
                  </div>
                </div>
                
                <div className="text-center mb-4">
                  <Button 
                    variant="link" 
                    className="text-decoration-none" 
                    onClick={() => setShowCode(!showCode)}
                  >
                    {showCode ? 'Hide Ticket Code' : 'Show Ticket Code'}
                  </Button>
                  
                  {showCode && (
                    <div className="mt-3 p-3 bg-light rounded text-center">
                      <div 
                        style={{ 
                          width: '150px', 
                          height: '150px', 
                          margin: '0 auto',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #dee2e6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column'
                        }}
                      >
                        <span>Ticket ID</span>
                        <strong style={{ marginTop: '10px', letterSpacing: '1px' }}>
                          {booking._id.slice(-8).toUpperCase()}
                        </strong>
                      </div>
                      <div className="mt-2">
                        <small className="text-muted">Show this code at the event entrance</small>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    className="d-flex align-items-center justify-content-center"
                    onClick={downloadTicket}
                  >
                    <FaDownload className="me-2" /> Download Ticket
                  </Button>
                  <Button 
                    variant="success" 
                    className="d-flex align-items-center justify-content-center"
                    as={Link}
                    to={`/bookings?highlight_booking=${booking._id}`}
                  >
                    <FaTicketAlt className="me-2" /> View Booking Details
                  </Button>
                  <Button 
                    variant="outline-primary"
                    className="d-flex align-items-center justify-content-center"
                    onClick={shareTicket}
                  >
                    <FaShareAlt className="me-2" /> Share Ticket
                  </Button>
                </div>
              </Card.Body>
            </Card>
            
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4">
                <h5 className="mb-3">Need help?</h5>
                <p>
                  If you have any questions about your booking, please contact the event organizer or our support team.
                </p>
                <div className="d-grid">
                  <Button 
                    variant="outline-secondary"
                    className="d-flex align-items-center justify-content-center"
                    as={Link}
                    to="/contact"
                  >
                    <FaEnvelope className="me-2" /> Contact Support
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
};

export default BookingSuccess;

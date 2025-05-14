import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { FaCheckCircle, FaDownload, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  
  // Get the booking ID from query parameters
  const queryParams = new URLSearchParams(location.search);
  const bookingId = queryParams.get('bookingId');
  
  useEffect(() => {
    // If we have a booking ID, redirect to the new BookingSuccess page
    if (bookingId) {
      // Short delay to give a sense of transition
      setTimeout(() => {
        navigate(`/booking-success/${bookingId}`);
      }, 1500);
    } else {
      setLoading(false);
    }
  }, [bookingId, navigate]);
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading booking details...</p>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-5 text-center">
              <div className="mb-4">
                <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                  <FaCheckCircle size={40} />
                </div>
                <h1 className="mt-2">Payment Successful!</h1>
                <p className="lead text-muted">
                  Thank you for your payment. Your transaction has been completed successfully.
                </p>
              </div>
              
              {booking ? (
                <div className="mt-4 text-start">
                  <h4 className="mb-3">Booking Details</h4>
                  <Card className="mb-4">
                    <Card.Body>
                      <h5>{booking.event.title}</h5>
                      <div className="mb-3 text-muted">
                        {booking.package && <div>Package: {booking.package.name}</div>}
                        <div className="d-flex align-items-center mt-2">
                          <FaCalendarAlt className="me-2" />
                          <span>
                            {new Date(booking.event.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                            {' '} at {booking.event.time}
                          </span>
                        </div>
                        <div className="d-flex align-items-center mt-1">
                          <FaMapMarkerAlt className="me-2" />
                          <span>{booking.event.location}</span>
                        </div>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between mb-2">
                        <span>Booking ID:</span>
                        <span className="fw-bold">{booking._id}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Quantity:</span>
                        <span>{booking.quantity}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Price per ticket:</span>
                        <span>${booking.ticketPrice.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Total Amount:</span>
                        <span className="fw-bold">${booking.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Status:</span>
                        <span className="text-success fw-bold">Confirmed</span>
                      </div>
                    </Card.Body>
                  </Card>
                  
                  <div className="d-grid gap-3">
                    <Button variant="success" className="d-flex align-items-center justify-content-center">
                      <FaDownload className="me-2" />
                      Download Ticket
                    </Button>
                    <div className="d-flex gap-2">
                      <Button variant="outline-primary" className="w-50" as={Link} to={`/events/${booking.event._id}`}>
                        View Event
                      </Button>
                      <Button variant="outline-secondary" className="w-50" as={Link} to="/bookings">
                        My Bookings
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <p>
                    We couldn't find your booking details, but your payment was successful. Please check your email for the booking confirmation.
                  </p>
                  <div className="d-grid gap-2 mt-4">
                    <Button variant="primary" as={Link} to="/events">
                      Explore More Events
                    </Button>
                    <Button variant="outline-secondary" as={Link} to="/bookings">
                      View My Bookings
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentSuccessPage;

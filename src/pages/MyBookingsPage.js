import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table, Form, Modal, ListGroup } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { FaEye, FaTimes, FaCalendarCheck, FaSearch, FaInfoCircle, FaMapMarkerAlt, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { getUserBookings } from '../redux/slices/bookingSlice';
import Loader from '../components/shared/Loader';
import Message from '../components/shared/Message';

const MyBookingsPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { bookings, loading, error } = useSelector((state) => state.bookings);
  
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Get highlight parameters from URL if they exist
  const queryParams = new URLSearchParams(location.search);
  const highlightTransactionId = queryParams.get('highlight_tran');
  const highlightBookingId = queryParams.get('highlight_booking');

  useEffect(() => {
    // Fetch bookings when component mounts or when returning from payment/booking process
    dispatch(getUserBookings());
    
    // Set up auto-refresh for bookings data
    const refreshInterval = setInterval(() => {
      dispatch(getUserBookings());
    }, 10000); // Refresh every 10 seconds to catch new bookings
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [dispatch]);
  
  // Find booking from highlight parameters and show details
  useEffect(() => {
    if (bookings.length > 0) {
      let recentBooking = null;
      
      // First try to find by direct booking ID (from BookingSuccess page)
      if (highlightBookingId) {
        recentBooking = bookings.find(booking => booking._id === highlightBookingId);
      }
      
      // If not found and we have a transaction ID (from PaymentSuccess page), try that
      if (!recentBooking && highlightTransactionId) {
        recentBooking = bookings.find(booking => 
          booking.paymentReference?.includes(highlightTransactionId) || 
          booking.transactionId === highlightTransactionId
        );
      }
      
      if (recentBooking) {
        setSelectedBooking(recentBooking);
        setShowEventDetails(true);
        
        // Automatically set the filter to show confirmed bookings
        setFilter('confirmed');
      }
    }
  }, [bookings, highlightTransactionId, highlightBookingId]);

  // Filter bookings based on status and search term
  const filteredBookings = bookings.filter((booking) => {
    const matchesFilter = 
      filter === 'all' || 
      booking.bookingStatus === filter;
      
    const matchesSearch = 
      booking.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking._id.toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesFilter && matchesSearch;
  });

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  // Handle showing event details
  const handleViewEventDetails = (booking) => {
    setSelectedBooking(booking);
    setShowEventDetails(true);
  };
  
  // Check if booking was recently paid or should be highlighted
  const isRecentlyPaid = (booking) => {
    // Check for direct booking highlight (from BookingSuccess page)
    if (highlightBookingId && booking._id === highlightBookingId) {
      return true;
    }
    
    // Check for payment-based highlight (from PaymentSuccess page)
    if (highlightTransactionId && (
      booking.paymentReference?.includes(highlightTransactionId) || 
      booking.transactionId === highlightTransactionId
    )) {
      return true;
    }
    
    return false;
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">My Bookings</h1>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={6} className="mb-3 mb-md-0">
              <Form.Group controlId="filter">
                <Form.Label>Filter by Status</Form.Label>
                <Form.Select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Bookings</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="search">
                <Form.Label>Search Bookings</Form.Label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>
                  <Form.Control
                    type="text"
                    placeholder="Search by event title or booking ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : bookings.length === 0 ? (
        <Card className="text-center p-5">
          <Card.Body>
            <h3 className="mb-3">You don't have any bookings yet</h3>
            <p className="text-muted mb-4">
              Explore events and make your first booking today!
            </p>
            <Link to="/events">
              <Button variant="primary" size="lg">
                Browse Events
              </Button>
            </Link>
          </Card.Body>
        </Card>
      ) : filteredBookings.length === 0 ? (
        <Message variant="info">
          No bookings match your current filters. Try adjusting your search criteria.
        </Message>
      ) : (
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr 
                      key={booking._id} 
                      className={isRecentlyPaid(booking) ? 'bg-light-success' : ''}
                      style={isRecentlyPaid(booking) ? { animation: 'highlight-row 2s ease-in-out 3' } : {}}
                    >
                      <td>
                        <span className="fw-bold">#{booking._id.substring(0, 8)}</span>
                        <div className="small text-muted">
                          {format(new Date(booking.bookingDate), 'MMM d, yyyy')}
                        </div>
                        {isRecentlyPaid(booking) && (
                          <Badge bg="success" className="mt-1">New Payment</Badge>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={
                              booking.event.eventImage?.startsWith('http')
                                ? booking.event.eventImage
                                : `http://localhost:5000/uploads/events/${booking.event.eventImage}`
                            }
                            alt={booking.event.title}
                            width="50"
                            height="50"
                            className="me-3 rounded"
                            style={{ objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.src = '/logo192.png'; // Using the default React logo as fallback
                            }}
                          />
                          <div>
                            <div className="fw-bold">{booking.event.title}</div>
                            <div className="small text-muted">
                              {booking.event.location}, {booking.event.city}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {format(new Date(booking.event.date), 'MMM d, yyyy')}
                        <div className="small text-muted">{booking.event.time}</div>
                      </td>
                      <td>
                        <Badge bg={getStatusBadgeColor(booking.bookingStatus)}>
                          {booking.bookingStatus.toUpperCase()}
                        </Badge>
                      </td>
                      <td>৳{booking.totalAmount.toFixed(2)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleViewEventDetails(booking)}
                          >
                            <FaInfoCircle className="me-1" /> Event Details
                          </Button>
                          
                          <Link to={`/bookings/${booking._id}`}>
                            <Button variant="outline-primary" size="sm">
                              <FaEye className="me-1" /> Booking
                            </Button>
                          </Link>
                          
                          {booking.bookingStatus !== 'cancelled' && 
                           new Date(booking.event.date) > new Date() && (
                            <Link to={`/bookings/${booking._id}`}>
                              <Button variant="outline-danger" size="sm">
                                <FaTimes className="me-1" /> Cancel
                              </Button>
                            </Link>
                          )}
                          
                          {booking.bookingStatus === 'confirmed' && !booking.appointmentTime && (
                            <Link to={`/bookings/${booking._id}`}>
                              <Button variant="outline-info" size="sm">
                                <FaCalendarCheck className="me-1" /> Schedule
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
      
      {/* Event Details Modal */}
      <Modal
        show={showEventDetails}
        onHide={() => setShowEventDetails(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaInfoCircle className="me-2" />
            Event Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBooking && (
            <>
              <Row>
                <Col md={5}>
                  <div className="position-relative">
                    <img
                      src={
                        selectedBooking.event.eventImage?.startsWith('http')
                          ? selectedBooking.event.eventImage
                          : `http://localhost:5000/uploads/events/${selectedBooking.event.eventImage}`
                      }
                      alt={selectedBooking.event.title}
                      className="img-fluid rounded mb-3"
                      style={{ width: '100%', height: '240px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = '/logo192.png';
                      }}
                    />
                    <Badge 
                      bg={getStatusBadgeColor(selectedBooking.bookingStatus)} 
                      className="position-absolute top-0 end-0 m-2 p-2"
                    >
                      {selectedBooking.bookingStatus.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <Card className="mb-3">
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">Booking Information</h5>
                    </Card.Header>
                    <ListGroup variant="flush">
                      <ListGroup.Item>
                        <strong>Booking ID:</strong> #{selectedBooking._id.substring(0, 8)}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Booking Date:</strong> {format(new Date(selectedBooking.bookingDate), 'MMM d, yyyy')}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Amount Paid:</strong> ৳{selectedBooking.totalAmount.toFixed(2)}
                      </ListGroup.Item>
                      {selectedBooking.paymentReference && (
                        <ListGroup.Item>
                          <strong>Transaction ID:</strong> {selectedBooking.paymentReference}
                        </ListGroup.Item>
                      )}
                    </ListGroup>
                  </Card>
                </Col>
                
                <Col md={7}>
                  <h3 className="mb-3">{selectedBooking.event.title}</h3>
                  
                  <div className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <FaCalendarAlt className="text-primary me-2" />
                      <div>
                        <strong>Date & Time:</strong><br/>
                        {format(new Date(selectedBooking.event.date), 'EEEE, MMMM d, yyyy')} at {selectedBooking.event.time}
                      </div>
                    </div>
                    
                    <div className="d-flex align-items-center mb-3">
                      <FaMapMarkerAlt className="text-primary me-2" />
                      <div>
                        <strong>Location:</strong><br/>
                        {selectedBooking.event.location}, {selectedBooking.event.city}
                      </div>
                    </div>
                  </div>
                  
                  <h5 className="mb-3">Event Description</h5>
                  <p className="text-muted mb-4">{selectedBooking.event.description}</p>
                  
                  <h5 className="mb-3">Booking Details</h5>
                  <Card>
                    <Table responsive borderless className="mb-0">
                      <tbody>
                        <tr>
                          <td><strong>Ticket Type:</strong></td>
                          <td>{selectedBooking.ticketType || 'Standard'}</td>
                        </tr>
                        <tr>
                          <td><strong>Quantity:</strong></td>
                          <td>{selectedBooking.quantity || 1}</td>
                        </tr>
                        <tr>
                          <td><strong>Unit Price:</strong></td>
                          <td>৳{(selectedBooking.totalAmount / (selectedBooking.quantity || 1)).toFixed(2)}</td>
                        </tr>
                        <tr className="table-light">
                          <td><strong>Total:</strong></td>
                          <td className="fw-bold">৳{selectedBooking.totalAmount.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Card>
                </Col>
              </Row>
              
              <hr className="my-4" />
              
              <div className="d-flex justify-content-between">
                <Link to={`/bookings/${selectedBooking._id}`}>
                  <Button variant="primary">
                    <FaEye className="me-2" />
                    View Full Booking Details
                  </Button>
                </Link>
                
                {selectedBooking.bookingStatus !== 'cancelled' && 
                 new Date(selectedBooking.event.date) > new Date() && (
                  <Link to={`/bookings/${selectedBooking._id}`}>
                    <Button variant="outline-danger">
                      <FaTimes className="me-1" /> Cancel Booking
                    </Button>
                  </Link>
                )}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default MyBookingsPage;

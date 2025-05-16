import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table, Form, Modal, ListGroup } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { FaEye, FaTimes, FaCalendarCheck, FaSearch, FaInfoCircle, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaCheckCircle, FaTicketAlt } from 'react-icons/fa';
import { getUserBookings } from '../redux/slices/bookingSlice';
import Loader from '../components/shared/Loader';
import Message from '../components/shared/Message';
import { toast } from 'react-toastify';

// CSS for highlighting new bookings
const highlightAnimation = `
  @keyframes highlight-row {
    0% { background-color: rgba(25, 135, 84, 0.1); }
    50% { background-color: rgba(25, 135, 84, 0.3); }
    100% { background-color: rgba(25, 135, 84, 0.1); }
  }
  
  .highlight-row {
    animation: highlight-row 2s ease-in-out infinite;
    background-color: rgba(25, 135, 84, 0.1);
  }
`;

const MyBookingsPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { bookings, loading, error } = useSelector((state) => state.bookings);
  
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Get highlight parameters from URL if they exist
  const queryParams = new URLSearchParams(location.search);
  const highlightTransactionId = queryParams.get('highlight_tran');
  const highlightBookingId = queryParams.get('highlight_booking');
  
  // New payment success parameters
  const paymentSuccess = queryParams.get('paymentSuccess');
  const bookingId = queryParams.get('bookingId');
  const transactionId = queryParams.get('transactionId');

  useEffect(() => {
    // Fetch bookings when component mounts or when returning from payment/booking process
    dispatch(getUserBookings());
    
    // Set up auto-refresh for bookings data - more frequent refresh for new payments
    const refreshInterval = setInterval(() => {
      dispatch(getUserBookings());
    }, paymentSuccess === 'true' ? 3000 : 10000); // More frequent refresh for new payments
    
    // Show success toast if redirected from payment success
    if (paymentSuccess === 'true') {
      toast.success('Payment successful! Your booking is confirmed.', {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        icon: <FaCheckCircle />
      });
      
      // Force immediate fetch for new booking data after payment
      const immediateRefresh = setTimeout(() => {
        dispatch(getUserBookings());
      }, 1000);
      
      return () => {
        clearTimeout(immediateRefresh);
        clearInterval(refreshInterval);
      };
    }
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [dispatch, paymentSuccess, bookingId]);
  
  // Find booking from highlight parameters and show details
  useEffect(() => {
    if (bookings.length > 0) {
      let recentBooking = null;
      
      // First check for booking ID from payment success redirect
      if (bookingId) {
        recentBooking = bookings.find(booking => booking._id === bookingId);
        
        // If coming from payment process, make this more visible
        if (recentBooking && paymentSuccess === 'true') {
          console.log('New booking found after payment:', recentBooking);
          
          // Scroll to ensure the new booking is visible
          setTimeout(() => {
            const bookingElement = document.getElementById(`booking-${recentBooking._id}`);
            if (bookingElement) {
              bookingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        }
      }
      
      // Then try to find by other highlight parameters if not found
      if (!recentBooking && highlightBookingId) {
        recentBooking = bookings.find(booking => booking._id === highlightBookingId);
      }
      
      // If still not found and we have a transaction ID, try that
      if (!recentBooking && (highlightTransactionId || transactionId)) {
        const searchTransactionId = highlightTransactionId || transactionId;
        recentBooking = bookings.find(booking => 
          booking.paymentReference?.includes(searchTransactionId) || 
          booking.transactionId === searchTransactionId
        );
      }
      
      if (recentBooking) {
        setSelectedBooking(recentBooking);
        setShowEventDetails(true);
        
        // Automatically set the filter to show confirmed bookings
        setFilter('confirmed');
      }
    } else if (paymentSuccess === 'true' && bookingId) {
      // If bookings haven't loaded yet but we're coming from payment, show loading indicator
      toast.info('Loading your booking details...', {
        position: 'top-right',
        autoClose: 2000
      });
      
      // Force another fetch to ensure we get the latest booking data
      dispatch(getUserBookings());
    }
  }, [bookings, highlightTransactionId, highlightBookingId, bookingId, transactionId, paymentSuccess, dispatch]);

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
    // Check for bookingId from payment success redirect
    if (bookingId && booking._id === bookingId) {
      return true;
    }
    
    // Check for transaction ID from payment redirect
    if (transactionId && (
      booking.paymentReference?.includes(transactionId) || 
      booking.transactionId === transactionId
    )) {
      return true;
    }
    
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
    <>
      {/* Add highlight animation styles */}
      <style>{highlightAnimation}</style>
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
                        id={`booking-${booking._id}`}
                        className={isRecentlyPaid(booking) ? 'highlight-row' : ''}
                        style={isRecentlyPaid(booking) ? { 
                          borderLeft: '4px solid #198754',
                          backgroundColor: paymentSuccess === 'true' && booking._id === bookingId ? 'rgba(25, 135, 84, 0.1)' : ''
                        } : {}}
                      >
                        <td>
                          <span className="fw-bold">#{booking._id.substring(0, 8)}</span>
                          {paymentSuccess === 'true' && booking._id === bookingId && (
                            <Badge bg="success" pill className="ms-2">
                              New
                            </Badge>
                          )}
                        </td>
                        <td>
                          <div className="fw-bold">{booking.event.title}</div>
                          <small className="text-muted">
                            {booking.ticketType || 'Standard'} Ticket
                          </small>
                        </td>
                        <td>
                          {new Date(booking.event.date).toLocaleDateString()}
                        </td>
                        <td>
                          <Badge bg={getStatusBadgeColor(booking.bookingStatus)}>
                            {booking.bookingStatus.charAt(0).toUpperCase() + booking.bookingStatus.slice(1)}
                          </Badge>
                        </td>
                        <td>
                          ৳{booking.totalAmount.toFixed(2)}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewEventDetails(booking)}
                            className="me-2"
                          >
                            <FaEye className="me-1" />
                            Details
                          </Button>
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
          <Modal.Header closeButton className="bg-light">
            <div className="d-flex align-items-center w-100 justify-content-between">
              <div className="d-flex align-items-center">
                <h3 className="text-success mb-0">Event Details</h3>
                {paymentSuccess === 'true' && bookingId === selectedBooking?._id && (
                  <Badge bg="success" className="ms-3 py-2 px-3">
                    <FaCheckCircle className="me-1" /> Just Confirmed
                  </Badge>
                )}
              </div>
              {selectedBooking && (
                <Badge 
                  bg={getStatusBadgeColor(selectedBooking.bookingStatus)} 
                  className="px-3 py-2"
                >
                  {selectedBooking.bookingStatus.charAt(0).toUpperCase() + selectedBooking.bookingStatus.slice(1)}
                </Badge>
              )}
            </div>
          </Modal.Header>
          <Modal.Body>
            {selectedBooking && (
              <>
                <Row>
                  <Col md={5}>
                    <Card className="mb-3">
                      <Card.Img 
                        variant="top" 
                        src={selectedBooking.event.image || 'https://via.placeholder.com/300x200?text=Event+Image'} 
                        alt={selectedBooking.event.title}
                      />
                      <Card.Body>
                        <Card.Title>{selectedBooking.event.title}</Card.Title>
                        <Card.Text className="text-muted">
                          {selectedBooking.event.shortDescription || 'No description available'}
                        </Card.Text>
                      </Card.Body>
                    </Card>
                    
                    <ListGroup className="mb-3 booking-details-list">
                      <ListGroup.Item className="d-flex justify-content-between bg-light">
                        <strong>Booking Information</strong>
                        <FaTicketAlt className="text-primary" />
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Booking ID:</span>
                        <span className="fw-bold">{selectedBooking._id}</span>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Booking Date:</span>
                        <span>{new Date(selectedBooking.createdAt).toLocaleString()}</span>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between bg-light">
                        <strong>Payment Information</strong>
                        <FaCheckCircle className="text-success" />
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Payment Status:</span>
                        <Badge bg={getStatusBadgeColor(selectedBooking.bookingStatus)} className="px-3 py-2">
                          {selectedBooking.bookingStatus.charAt(0).toUpperCase() + selectedBooking.bookingStatus.slice(1)}
                        </Badge>
                      </ListGroup.Item>
                      {selectedBooking.transactionId && (
                        <ListGroup.Item className="d-flex justify-content-between">
                          <span>Transaction ID:</span>
                          <span className="fw-bold">{selectedBooking.transactionId}</span>
                        </ListGroup.Item>
                      )}
                      {selectedBooking.paymentReference && (
                        <ListGroup.Item className="d-flex justify-content-between">
                          <span>Payment Reference:</span>
                          <span className="fw-bold">{selectedBooking.paymentReference}</span>
                        </ListGroup.Item>
                      )}
                      {paymentSuccess === 'true' && bookingId === selectedBooking._id && (
                        <ListGroup.Item className="bg-success text-white">
                          <div className="d-flex align-items-center justify-content-center">
                            <FaCheckCircle className="me-2" />
                            <span className="fw-bold">Payment Confirmed</span>
                          </div>
                        </ListGroup.Item>
                      )}
                    </ListGroup>
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
                    
                    <h5 className="mt-4 mb-3">Booking Details</h5>
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-light">
                        <h5 className="mb-0">Ticket Details</h5>
                      </Card.Header>
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
                            <td><strong>Total Amount:</strong></td>
                            <td className="fw-bold text-success">৳{selectedBooking.totalAmount.toFixed(2)}</td>
                          </tr>
                          {selectedBooking.paymentMethod && (
                            <tr>
                              <td><strong>Payment Method:</strong></td>
                              <td>{selectedBooking.paymentMethod === 'sslcommerz' ? 'SSLCommerz' : selectedBooking.paymentMethod}</td>
                            </tr>
                          )}
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
    </>
  );
};

export default MyBookingsPage;
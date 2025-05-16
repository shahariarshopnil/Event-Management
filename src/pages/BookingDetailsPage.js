import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Modal, Form } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaTicketAlt,
  FaClock,
  FaMoneyBillWave,
  FaTimes,
  FaCheckCircle,
  FaPrint,
} from 'react-icons/fa';
import {
  getBookingById,
  cancelBooking,
  resetBookingSuccess,
  updateBookingStatus,
  scheduleAppointment,
} from '../redux/slices/bookingSlice';
import Loader from '../components/shared/Loader';
import Message from '../components/shared/Message';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const BookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { booking, loading, success, error } = useSelector((state) => state.bookings);
  const { userInfo } = useSelector((state) => state.auth);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    dispatch(getBookingById(id));

    if (success) {
      dispatch(resetBookingSuccess());
      if (showCancelModal) {
        setShowCancelModal(false);
        toast.success('Booking cancelled successfully');
        navigate('/bookings');
      }
      if (showAppointmentModal) {
        setShowAppointmentModal(false);
        toast.success('Appointment scheduled successfully');
      }
      if (showStatusModal) {
        setShowStatusModal(false);
        toast.success('Booking status updated successfully');
      }
    }
  }, [dispatch, id, success, navigate, showCancelModal, showAppointmentModal, showStatusModal]);

  const handleCancelBooking = () => {
    dispatch(cancelBooking({ id, reason: cancellationReason }));
  };

  const handleScheduleAppointment = () => {
    dispatch(scheduleAppointment({ id, appointmentTime: appointmentDate }));
  };

  const handleUpdateStatus = () => {
    dispatch(updateBookingStatus({ id, status: newStatus }));
  };

  const handlePrint = () => {
    window.print();
  };

  // Check if user is authorized to view this booking
  const isAuthorized = () => {
    if (!booking || !userInfo) return false;
    
    // User who made the booking
    if (booking.user._id === userInfo._id) return true;
    
    // Event organizer
    if (booking.event.organizer && booking.event.organizer._id === userInfo._id) return true;
    
    // Admin
    if (userInfo.role === 'admin') return true;
    
    return false;
  };

  // Determine if booking can be cancelled
  const canCancel = () => {
    if (!booking) return false;
    
    // Can only cancel if booking status is confirmed or pending
    if (booking.bookingStatus === 'cancelled') return false;
    
    // Can only cancel if event has not yet occurred
    const eventDate = new Date(booking.event.date);
    const now = new Date();
    return eventDate > now;
  };

  // Determine if booking status can be changed (organizer/admin only)
  const canChangeStatus = () => {
    if (!booking || !userInfo) return false;
    
    // Only organizer or admin can change status
    const isOrganizerOrAdmin = 
      (booking.event.organizer && booking.event.organizer._id === userInfo._id) || 
      userInfo.role === 'admin';
      
    // Can only change status if not cancelled
    return isOrganizerOrAdmin && booking.bookingStatus !== 'cancelled';
  };

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

  return (
    <Container className="py-4">
      <h1 className="mb-4">Booking Details</h1>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : !booking ? (
        <Message variant="info">Booking not found</Message>
      ) : !isAuthorized() ? (
        <Message variant="danger">
          You are not authorized to view this booking
        </Message>
      ) : (
        <>
          <Row className="mb-4">
            <Col lg={8}>
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Booking #{booking._id.substring(0, 8)}</h5>
                  <Badge bg={getStatusBadgeColor(booking.bookingStatus)} className="px-3 py-2">
                    {booking.bookingStatus.toUpperCase()}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Card.Title>Event Information</Card.Title>
                      <ListGroup variant="flush" className="mb-4">
                        <ListGroup.Item>
                          <strong>Event:</strong>{' '}
                          <Link to={`/events/${booking.event._id}`}>
                            {booking.event.title}
                          </Link>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <div className="d-flex align-items-center">
                            <FaCalendarAlt className="me-2 text-primary" />
                            <div>
                              <strong>Date:</strong>{' '}
                              {format(new Date(booking.event.date), 'PPPP')}
                            </div>
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <div className="d-flex align-items-center">
                            <FaClock className="me-2 text-primary" />
                            <div>
                              <strong>Time:</strong> {booking.event.time}
                            </div>
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <div className="d-flex align-items-center">
                            <FaMapMarkerAlt className="me-2 text-primary" />
                            <div>
                              <strong>Location:</strong> {booking.event.location},{' '}
                              {booking.event.city}
                            </div>
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <div className="d-flex align-items-center">
                            <FaUser className="me-2 text-primary" />
                            <div>
                              <strong>Organizer:</strong>{' '}
                              {booking.event.organizer
                                ? booking.event.organizer.name
                                : 'N/A'}
                            </div>
                          </div>
                        </ListGroup.Item>
                      </ListGroup>
                    </Col>
                    <Col md={6}>
                      <Card.Title>Booking Information</Card.Title>
                      <ListGroup variant="flush">
                        <ListGroup.Item>
                          <div className="d-flex align-items-center">
                            <FaTicketAlt className="me-2 text-primary" />
                            <div>
                              <strong>Tickets:</strong> {booking.numberOfTickets}
                            </div>
                          </div>
                        </ListGroup.Item>
                        {booking.package && (
                          <ListGroup.Item>
                            <strong>Package:</strong> {booking.package.name}
                          </ListGroup.Item>
                        )}
                        <ListGroup.Item>
                          <div className="d-flex align-items-center">
                            <FaMoneyBillWave className="me-2 text-primary" />
                            <div>
                              <strong>Total Amount:</strong> ৳
                              {booking.totalAmount.toFixed(2)}
                            </div>
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <strong>Payment Method:</strong>{' '}
                          {booking.paymentMethod.replace('_', ' ').toUpperCase()}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <strong>Payment Status:</strong>{' '}
                          <Badge bg={
                            booking.paymentStatus === 'completed'
                              ? 'success'
                              : booking.paymentStatus === 'pending'
                              ? 'warning'
                              : 'danger'
                          }>
                            {booking.paymentStatus.toUpperCase()}
                          </Badge>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <strong>Booking Date:</strong>{' '}
                          {format(new Date(booking.bookingDate), 'PPP')}
                        </ListGroup.Item>
                        {booking.appointmentTime && (
                          <ListGroup.Item>
                            <strong>Appointment Time:</strong>{' '}
                            {format(new Date(booking.appointmentTime), 'PPpp')}
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                    </Col>
                  </Row>

                  {booking.specialRequirements && (
                    <div className="mt-4">
                      <h6>Special Requirements:</h6>
                      <p className="border p-3 rounded">{booking.specialRequirements}</p>
                    </div>
                  )}

                  {booking.cancellationReason && (
                    <div className="mt-4">
                      <h6>Cancellation Reason:</h6>
                      <p className="border p-3 rounded bg-danger-subtle">
                        {booking.cancellationReason}
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {booking.attendees && booking.attendees.length > 0 && (
                <Card className="shadow-sm">
                  <Card.Header className="bg-white">
                    <h5 className="mb-0">Attendees</h5>
                  </Card.Header>
                  <Card.Body>
                    <ListGroup>
                      {booking.attendees.map((attendee, index) => (
                        <ListGroup.Item key={index} className="d-flex justify-content-between">
                          <div>
                            <strong>{attendee.name}</strong>
                            <div className="text-muted">{attendee.email}</div>
                          </div>
                          <Badge bg="primary">Ticket #{index + 1}</Badge>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card.Body>
                </Card>
              )}
            </Col>

            <Col lg={4}>
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Actions</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button variant="outline-primary" onClick={handlePrint}>
                      <FaPrint className="me-2" /> Print Booking
                    </Button>

                    {canCancel() && booking.user._id === userInfo._id && (
                      <Button
                        variant="outline-danger"
                        onClick={() => setShowCancelModal(true)}
                      >
                        <FaTimes className="me-2" /> Cancel Booking
                      </Button>
                    )}

                    {canChangeStatus() && (
                      <Button
                        variant="outline-warning"
                        onClick={() => setShowStatusModal(true)}
                      >
                        <FaCheckCircle className="me-2" /> Update Status
                      </Button>
                    )}

                    {booking.bookingStatus === 'confirmed' && (
                      <Button
                        variant="outline-info"
                        onClick={() => setShowAppointmentModal(true)}
                      >
                        <FaCalendarAlt className="me-2" /> Schedule Appointment
                      </Button>
                    )}

                    <Link to="/bookings">
                      <Button variant="outline-secondary" className="w-100">
                        Back to Bookings
                      </Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Contact Information</h5>
                </Card.Header>
                <Card.Body>
                  <h6>Booker</h6>
                  <p>
                    <strong>{booking.user.name}</strong>
                    <br />
                    Email: {booking.user.email}
                  </p>

                  {booking.event.organizer && (
                    <>
                      <h6 className="mt-3">Organizer</h6>
                      <p className="mb-0">
                        <strong>{booking.event.organizer.name}</strong>
                        <br />
                        Email: {booking.event.organizer.email}
                        <br />
                        Phone: {booking.event.organizer.phone}
                      </p>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Cancellation Modal */}
          <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Cancel Booking</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Are you sure you want to cancel this booking?</p>
              <p className="text-danger">This action cannot be undone.</p>
              <Form.Group className="mb-3">
                <Form.Label>Reason for Cancellation</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation"
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
                Close
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelBooking}
                disabled={!cancellationReason.trim()}
              >
                Confirm Cancellation
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Appointment Modal */}
          <Modal show={showAppointmentModal} onHide={() => setShowAppointmentModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Schedule Appointment</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>
                Schedule a specific appointment time for this booking. This can be used
                for consultations, meetings, or specific time slots.
              </p>
              <Form.Group className="mb-3">
                <Form.Label>Appointment Date and Time</Form.Label>
                <DatePicker
                  selected={appointmentDate}
                  onChange={(date) => setAppointmentDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="form-control"
                  minDate={new Date()}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAppointmentModal(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={handleScheduleAppointment}>
                Schedule Appointment
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Status Update Modal */}
          <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Update Booking Status</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="">Select Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateStatus}
                disabled={!newStatus}
              >
                Update Status
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </Container>
  );
};

export default BookingDetailsPage;

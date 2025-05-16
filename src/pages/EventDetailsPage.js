import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Badge, 
  Button, 
  ListGroup,
  Tab,
  Nav,
  Modal,
  Form,
  Breadcrumb,
  Alert
} from 'react-bootstrap';
import { format, addHours, addMinutes, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaClock, 
  FaUser, 
  FaUsers, 
  FaTicketAlt, 
  FaEdit, 
  FaTrash,
  FaShare,
  FaPhoneAlt,
  FaEnvelope,
  FaGlobe,
  FaInfoCircle,
  FaHeart,
  FaRegHeart,
  FaDownload,
  FaExclamationCircle,
  FaCheckCircle
} from 'react-icons/fa';
import BookingButton from '../components/buttons/BookingButton';
import { 
  getEventDetails, 
  registerForEvent,
  resetEventSuccess
} from '../redux/slices/eventSlice';
import { getEventPackages } from '../redux/slices/packageSlice';
import { createBooking, resetBookingSuccess, clearBookingError } from '../redux/slices/bookingSlice';
import { resetPaymentState } from '../redux/slices/paymentSlice';
import ReviewSection from '../components/events/ReviewSection';
import Loader from '../components/shared/Loader';
import Message from '../components/shared/Message';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { event, loading: eventLoading } = useSelector((state) => state.events);
  const { loading: bookingLoading, success: bookingSuccess, error: bookingError } = useSelector((state) => state.bookings);
  const { packages } = useSelector((state) => state.packages);
  const { userInfo } = useSelector((state) => state.auth);
  
  const [showBookModal, setShowBookModal] = useState(false);
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [specialRequirements, setSpecialRequirements] = useState('');
  
  // Determine if user is already registered for this event
  const isRegistered = event?.attendees?.some(
    (attendee) => attendee.user === (userInfo?._id || '') && attendee.status !== 'cancelled'
  );
  
  // Determine if user is the organizer of this event
  const isOrganizer = userInfo && event && event.organizer && 
    event.organizer._id === userInfo._id;

  useEffect(() => {
    dispatch(getEventDetails(id));
    dispatch(getEventPackages(id));
    
    if (bookingSuccess) {
      dispatch(resetBookingSuccess());
    }
    
    if (bookingError) {
      dispatch(clearBookingError());
    }
  }, [dispatch, id, bookingSuccess, bookingError]);

  useEffect(() => {
    return () => {
      dispatch(resetBookingSuccess());
      dispatch(clearBookingError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (bookingSuccess) {
      toast.success('Booking created successfully!');
      navigate('/bookings');
    }
    if (bookingError) {
      toast.error(bookingError);
    }
  }, [bookingSuccess, bookingError, dispatch, navigate]);

  const handleBookEvent = (selectedPkg = null) => {
    if (!userInfo) {
      toast.info('Please login to book this event');
      navigate('/login');
      return;
    }
    
    // If no package is provided or the provided package is sold out, open the booking modal
    if (!selectedPkg || (selectedPkg && selectedPkg.availableBookings <= 0)) {
      setShowBookModal(true);
      
      // If a package was provided but is sold out, show an error
      if (selectedPkg && selectedPkg.availableBookings <= 0) {
        toast.error('Sorry, that package is sold out. Please select a different one.');
      }
      return;
    }
    
    // Create booking directly instead of going to checkout
    const bookingData = {
      event: event._id,
      package: selectedPkg._id,
      numberOfTickets: 1,
      paymentMethod: 'credit_card',
      specialRequirements: '',
    };
    
    // Show confirmation dialog
    if (window.confirm(`Confirm booking for ${selectedPkg.name} package at ৳${selectedPkg.price}?`)) {
      // Create the booking directly
      dispatch(createBooking(bookingData));
      toast.info('Processing your booking...');
    }
  };

  const handleBookSubmit = (e) => {
    e.preventDefault();
    
    // Validate the booking data
    if (numberOfTickets < 1) {
      toast.error('Please select at least 1 ticket');
      return;
    }
    
    const bookingData = {
      event: id,
      numberOfTickets,
      paymentMethod,
      specialRequirements,
    };
    
    if (selectedPackage) {
      bookingData.package = selectedPackage;
    } else {
      // If no package is selected, use the first available package or show an error
      const defaultPackage = packages && packages.length > 0 ? 
        packages.find(pkg => pkg.availableBookings > 0) : null;
        
      if (defaultPackage) {
        bookingData.package = defaultPackage._id;
      } else {
        toast.error('No packages available for this event');
        return;
      }
    }
    
    // Confirm the booking with the user
    const selectedPkg = selectedPackage ? 
      packages.find(pkg => pkg._id === selectedPackage) : 
      packages.find(pkg => pkg.availableBookings > 0);
    
    const totalPrice = (selectedPkg ? selectedPkg.price : event.price) * numberOfTickets;
    
    if (window.confirm(`Confirm booking for ৳${totalPrice.toFixed(2)}?`)) {
      dispatch(createBooking(bookingData));
      toast.info('Processing your booking...');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.shortDescription,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  // Calculate total amount based on selected package and number of tickets
  const calculateTotal = () => {
    let basePrice = event?.price || 0;
    
    if (selectedPackage && packages) {
      const packageObj = packages.find(pkg => pkg._id === selectedPackage);
      if (packageObj) {
        basePrice = packageObj.price;
      }
    }
    
    return (basePrice * numberOfTickets).toFixed(2);
  };

  return (
    <Container className="py-4">
      {eventLoading ? (
        <Loader />
      ) : bookingError ? (
        <Message variant="danger">{bookingError}</Message>
      ) : !event ? (
        <Message variant="info">Event not found</Message>
      ) : (
        <>
          {/* Event Header */}
          <Card className="mb-4 border-0 shadow-sm">
            <div className="position-relative">
              <Card.Img
                src={
                  event.eventImage.startsWith('http')
                    ? event.eventImage
                    : `http://localhost:5000/uploads/events/${event.eventImage}`
                }
                alt={event.title}
                style={{ height: '300px', objectFit: 'cover' }}
              />
              <div className="position-absolute top-0 end-0 p-3 d-flex gap-2">
                <Badge bg={
                  event.status === 'upcoming'
                    ? 'primary'
                    : event.status === 'ongoing'
                    ? 'success'
                    : event.status === 'completed'
                    ? 'secondary'
                    : 'danger'
                } className="fs-6 px-3 py-2">
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </Badge>
                {event.featured && (
                  <Badge bg="warning" className="fs-6 px-3 py-2">
                    Featured
                  </Badge>
                )}
              </div>
            </div>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start flex-wrap">
                <div>
                  <h1 className="mb-2">{event.title}</h1>
                  <div className="mb-3 d-flex flex-wrap gap-3">
                    <div className="d-flex align-items-center text-muted">
                      <FaCalendarAlt className="me-2" />
                      <span>
                        {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="d-flex align-items-center text-muted">
                      <FaClock className="me-2" />
                      <span>{event.time}</span>
                    </div>
                    <div className="d-flex align-items-center text-muted">
                      <FaMapMarkerAlt className="me-2" />
                      <span>
                        {event.location}, {event.city}, {event.country}
                      </span>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <Badge bg="secondary" className="px-3 py-2">
                      {event.category?.name || 'General'}
                    </Badge>
                    {event.tags.map((tag, index) => (
                      <Badge key={index} bg="light" text="dark" className="px-3 py-2">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                  <Button variant="outline-primary" onClick={handleShare}>
                    <FaShare className="me-1" /> Share
                  </Button>
                  {isOrganizer && (
                    <>
                      <Link to={`/events/edit/${event._id}`}>
                        <Button variant="outline-primary">
                          <FaEdit className="me-1" /> Edit
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          <Row>
            <Col md={8}>
              {/* Event Tabs: Details, Location, Packages */}
              <Tab.Container defaultActiveKey="details">
                <Card className="mb-4 shadow-sm">
                  <Card.Header className="bg-white">
                    <Nav variant="tabs">
                      <Nav.Item>
                        <Nav.Link eventKey="details">Details</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="location">Location</Nav.Link>
                      </Nav.Item>
                      {packages?.length > 0 && (
                        <Nav.Item>
                          <Nav.Link eventKey="packages">Packages</Nav.Link>
                        </Nav.Item>
                      )}
                      <Nav.Item>
                        <Nav.Link eventKey="reviews">Reviews</Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Tab.Content>
                      <Tab.Pane eventKey="details">
                        <h3 className="mb-3">About this event</h3>
                        <div className="mb-4">
                          {event.description.split('\n').map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                          ))}
                        </div>
                        
                        {event.tags && event.tags.length > 0 && (
                          <div className="mb-4">
                            <h4 className="h5 mb-2">Tags</h4>
                            <div className="d-flex flex-wrap gap-2">
                              {event.tags.map((tag, index) => (
                                <Badge 
                                  key={index} 
                                  bg="light" 
                                  text="dark" 
                                  className="px-3 py-2 border"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="alert alert-info d-flex align-items-start">
                          <FaInfoCircle className="me-2 mt-1" />
                          <div>
                            <strong>Important Information:</strong>
                            <ul className="mb-0 mt-1">
                              <li>Please arrive 15 minutes before the event starts</li>
                              <li>Bring your booking confirmation</li>
                              <li>Parking is available at the venue</li>
                            </ul>
                          </div>
                        </div>
                      </Tab.Pane>
                      <Tab.Pane eventKey="location">
                        <h3 className="mb-3">Event Location</h3>
                        <p>
                          <FaMapMarkerAlt className="me-2" />
                          {event.address}, {event.city}{' '}
                          {event.state && `, ${event.state}`}{' '}
                          {event.zipCode && event.zipCode}, {event.country}
                        </p>
                        <div className="mt-3">
                          <img
                            src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(
                              `${event.address}, ${event.city}, ${event.country}`
                            )}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${encodeURIComponent(
                              `${event.address}, ${event.city}, ${event.country}`
                            )}&key=YOUR_GOOGLE_MAPS_API_KEY`}
                            alt="Event location map"
                            className="img-fluid rounded"
                          />
                        </div>
                      </Tab.Pane>
                      {packages?.length > 0 && (
                        <Tab.Pane eventKey="packages">
                          <h3 className="mb-3">Available Packages</h3>
                          <Row>
                            {packages.map((pkg) => (
                              <Col key={pkg._id} md={6} lg={4} className="mb-4">
                                <Card className="h-100 shadow-sm package-card">
                                  <Card.Header className="bg-primary text-white py-3 position-relative">
                                    <h5 className="mb-0">{pkg.name}</h5>
                                    {pkg.maxBookings <= 5 && (
                                      <div className="position-absolute top-0 end-0 translate-middle">
                                        <Badge bg="danger" pill className="px-3 py-2">
                                          Limited Spots!
                                        </Badge>
                                      </div>
                                    )}
                                  </Card.Header>
                                  <Card.Body className="d-flex flex-column">
                                    <Card.Title className="text-center my-3">
                                      <span className="h2">৳{pkg.price.toFixed(2)}</span>
                                      <span className="text-muted"> / ticket</span>
                                    </Card.Title>
                                    <div className="mb-4">
                                      <p className="text-center text-muted">{pkg.description}</p>
                                    </div>
                                    <ListGroup variant="flush" className="flex-grow-1 mb-3">
                                      {pkg.features.map((feature, index) => (
                                        <ListGroup.Item key={index} className="border-0 py-2">
                                          <div className="d-flex align-items-center">
                                            <div className="text-success me-2">✓</div>
                                            <div>{feature}</div>
                                          </div>
                                        </ListGroup.Item>
                                      ))}
                                    </ListGroup>
                                    <BookingButton
                                      eventId={event._id}
                                      package={pkg}
                                      variant="primary"
                                      className="w-100 mt-auto"
                                      directBooking={false}
                                      directBookingHandler={handleBookEvent}
                                    />
                                    
                                    {pkg.availableBookings > 0 && (
                                      <div className="text-center mt-2">
                                        <small className="text-success">Available for booking</small>
                                      </div>
                                    )}
                                  </Card.Body>
                                  <Card.Footer className="bg-white text-center py-3">
                                    <div className="d-flex flex-column">
                                      <div className="d-flex justify-content-between align-items-center mb-1">
                                        <div>
                                          <FaTicketAlt className="text-muted me-2" />
                                          <span className="text-muted">
                                            {pkg.availableBookings > 0 ? (
                                              <>{pkg.availableBookings} tickets available</>
                                            ) : (
                                              <>Sold out</>
                                            )}
                                          </span>
                                        </div>
                                        <small className="text-muted">
                                          {pkg.maxBookings - pkg.availableBookings}/{pkg.maxBookings} booked
                                        </small>
                                      </div>
                                      
                                      {/* Progress bar showing availability */}
                                      <div className="progress" style={{ height: '6px' }}>
                                        <div 
                                          className={`progress-bar ${pkg.availableBookings < pkg.maxBookings * 0.2 ? 'bg-danger' : pkg.availableBookings < pkg.maxBookings * 0.5 ? 'bg-warning' : 'bg-success'}`} 
                                          role="progressbar" 
                                          style={{ width: `${(1 - pkg.availableBookings/pkg.maxBookings) * 100}%` }}
                                          aria-valuenow={(1 - pkg.availableBookings/pkg.maxBookings) * 100} 
                                          aria-valuemin="0" 
                                          aria-valuemax="100">
                                        </div>
                                      </div>
                                    </div>
                                  </Card.Footer>
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        </Tab.Pane>
                      )}
                      <Tab.Pane eventKey="reviews">
                        <ReviewSection eventId={id} />
                      </Tab.Pane>
                    </Tab.Content>
                  </Card.Body>
                </Card>
              </Tab.Container>

              {/* Organizer Information */}
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-white">
                  <h3 className="mb-0 h5">Organizer</h3>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="d-flex">
                    <div className="me-3">
                      {event.organizer?.profileImage ? (
                        <img 
                          src={`http://localhost:5000/uploads/profiles/${event.organizer.profileImage}`} 
                          alt={event.organizer.name} 
                          className="rounded-circle"
                          style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                          style={{ width: '80px', height: '80px' }}
                        >
                          <FaUser size={30} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="mb-1">{event.organizer?.name}</h4>
                      <p className="mb-3 text-muted">
                        {event.organizer?.role === 'organizer' ? 'Professional Event Organizer' : 'Event Host'}
                      </p>
                      
                      <div className="mb-1">
                        <div className="d-flex align-items-center mb-2">
                          <FaEnvelope className="text-muted me-2" />
                          <a href={`mailto:${event.organizer?.email}`} className="text-decoration-none">
                            {event.organizer?.email}
                          </a>
                        </div>
                        
                        {event.organizer?.phone && (
                          <div className="d-flex align-items-center mb-2">
                            <FaPhoneAlt className="text-muted me-2" />
                            <a href={`tel:${event.organizer?.phone}`} className="text-decoration-none">
                              {event.organizer?.phone}
                            </a>
                          </div>
                        )}
                        
                        {event.organizer?.website && (
                          <div className="d-flex align-items-center">
                            <FaGlobe className="text-muted me-2" />
                            <a href={event.organizer?.website} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                              {event.organizer?.website.replace(/(https?:\/\/)?(www\.)?/i, '')}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {event.organizer?.bio && (
                    <div className="mt-3 pt-3 border-top">
                      <h5 className="h6 mb-2">About the organizer</h5>
                      <p className="mb-0">{event.organizer?.bio}</p>
                    </div>
                  )}
                </Card.Body>
                <Card.Footer className="bg-white p-3">
                  <Button variant="outline-primary" size="sm" className="w-100">
                    View all events by this organizer
                  </Button>
                </Card.Footer>
              </Card>
            </Col>

            <Col md={4}>
              {/* Booking Card */}
              <Card className="shadow mb-4 sticky-top" style={{ top: '20px' }}>
                <Card.Header className="bg-primary text-white p-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h3 className="h5 mb-0">
                      {event.price > 0 ? (
                        <>Tickets from ৳{event.price.toFixed(2)}</>
                      ) : (
                        <>Free Event</>
                      )}
                    </h3>
                    <Button 
                      variant="outline-light" 
                      size="sm" 
                      onClick={() => {}}
                      className="d-flex align-items-center"
                    >
                      <FaHeart className="me-1" /> Save
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body className="p-4">
                  {event.status === 'upcoming' ? (
                    <div className="alert alert-success mb-3">
                      <div className="d-flex">
                        <div className="me-2">
                          <FaCalendarAlt size={18} />
                        </div>
                        <div>
                          Event starts in {calculateTimeUntilEvent(event.date)}
                        </div>
                      </div>
                    </div>
                  ) : event.status === 'ongoing' ? (
                    <div className="alert alert-warning mb-3">
                      <div className="d-flex">
                        <div className="me-2">
                          <FaClock size={18} />
                        </div>
                        <div>
                          This event is happening now!
                        </div>
                      </div>
                    </div>
                  ) : event.status === 'completed' ? (
                    <div className="alert alert-secondary mb-3">
                      <div className="d-flex">
                        <div className="me-2">
                          <FaExclamationCircle size={18} />
                        </div>
                        <div>
                          This event has ended
                        </div>
                      </div>
                    </div>
                  ) : null}
                
                  <ListGroup variant="flush" className="mb-3">
                    <ListGroup.Item className="d-flex py-3">
                      <div className="me-3 text-primary">
                        <FaCalendarAlt size={18} />
                      </div>
                      <div>
                        <div className="fw-bold">Date and Time</div>
                        <div>{format(new Date(event.date), 'EEE, MMM d, yyyy')}</div>
                        <div>
                          {event.time} - {event.endTime || calculateEndTime(event.time, 3)}
                        </div>
                      </div>
                    </ListGroup.Item>
                    
                    <ListGroup.Item className="d-flex py-3">
                      <div className="me-3 text-primary">
                        <FaMapMarkerAlt size={18} />
                      </div>
                      <div>
                        <div className="fw-bold">Location</div>
                        <div>{event.location}</div>
                        <div>{event.address}, {event.city}</div>
                        <div>{event.state && `${event.state}, `}{event.country}</div>
                      </div>
                    </ListGroup.Item>
                    
                    <ListGroup.Item className="d-flex py-3">
                      <div className="me-3 text-primary">
                        <FaUsers size={18} />
                      </div>
                      <div>
                        <div className="fw-bold">Capacity</div>
                        <div>
                          {event.availableSlots} spots left out of {event.maxAttendees}
                        </div>
                        {event.availableSlots <= 10 && event.availableSlots > 0 && (
                          <div className="text-danger mt-1 small">
                            <FaExclamationCircle className="me-1" />
                            Only {event.availableSlots} tickets left!
                          </div>
                        )}
                      </div>
                    </ListGroup.Item>
                  </ListGroup>

                  {event.status === 'upcoming' ? (
                    isRegistered ? (
                      <div className="alert alert-success d-flex align-items-start">
                        <div className="me-3 text-success">
                          <FaCheckCircle size={24} />
                        </div>
                        <div>
                          <p className="mb-2"><strong>You're registered for this event!</strong></p>
                          <Button 
                            variant="outline-success" 
                            size="sm" 
                            className="d-flex align-items-center"
                            onClick={() => {}}
                          >
                            <FaDownload className="me-1" /> Download Ticket
                          </Button>
                        </div>
                      </div>
                    ) : event.availableSlots > 0 ? (
                      <>
                        <div className="d-grid gap-2 mb-3">
                          <BookingButton
                            eventId={event._id}
                            variant="primary"
                            size="lg"
                            className="py-3"
                            directBooking={true}
                            directBookingHandler={handleBookEvent}
                            disabled={event.availableSlots <= 0}
                          >
                            {event.availableSlots <= 0 ? 'Sold Out' : 'Book Tickets Now'}
                          </BookingButton>
                        </div>
                        {event.availableSlots <= 10 && (
                          <div className="text-center text-danger small mb-3">
                            <FaExclamationCircle className="me-1" />
                            Selling fast! Only {event.availableSlots} tickets left.
                          </div>
                        )}
                        <div className="text-center text-muted small">
                          Secure your spot now before tickets sell out!
                        </div>
                      </>
                    ) : (
                      <div className="alert alert-danger d-flex align-items-start">
                        <div className="me-3 text-danger">
                          <FaExclamationCircle size={24} />
                        </div>
                        <div>
                          <p className="mb-2"><strong>This event is sold out.</strong></p>
                          <div className="small">Join the waitlist to be notified if spots become available.</div>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => {}}
                          >
                            Join Waitlist
                          </Button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="alert alert-secondary d-flex align-items-start">
                      <div className="me-3">
                        <FaExclamationCircle size={24} />
                      </div>
                      <div>
                        <p className="mb-2"><strong>
                          {event.status === 'completed' ? 'This event has already taken place.' : 'This event has been cancelled.'}
                        </strong></p>
                        <div className="small">
                          {event.status === 'completed' 
                            ? 'Check out upcoming events by this organizer.' 
                            : 'Please contact the organizer for more information.'}
                        </div>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Booking Modal */}
          <Modal show={showBookModal} onHide={() => setShowBookModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Book Event: {event?.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {bookingError && <Message variant="danger">{bookingError}</Message>}
              <Form onSubmit={handleBookSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Number of Tickets</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max={event.availableSlots}
                    value={numberOfTickets}
                    onChange={(e) => setNumberOfTickets(e.target.value)}
                  />
                </Form.Group>

                {packages?.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Select Package (Optional)</Form.Label>
                    <Form.Select
                      value={selectedPackage}
                      onChange={(e) => setSelectedPackage(e.target.value)}
                    >
                      <option value="">Standard Ticket (৳{event.price})</option>
                      {packages.map((pkg) => (
                        <option key={pkg._id} value={pkg._id}>
                          {pkg.name} (৳{pkg.price})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Payment Method</Form.Label>
                  <Form.Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    {event.price === 0 && <option value="free">Free Event</option>}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Special Requirements (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                  />
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span>Total Amount:</span>
                  <span className="fs-4 fw-bold">৳{calculateTotal()}</span>
                </div>

                <div className="d-grid">
                  <Button variant="primary" type="submit">
                    Confirm Booking
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        </>
      )}
    </Container>
  );
};

// Helper function to calculate time until event
const calculateTimeUntilEvent = (eventDate) => {
  const now = new Date();
  const eventDateTime = new Date(eventDate);
  const diffTime = eventDateTime - now;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 30) {
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  }
};

// Helper function to calculate end time based on start time and duration
const calculateEndTime = (startTime, durationHours) => {
  // Parse the start time (assuming format like "19:00")
  const [hours, minutes] = startTime.split(':').map(Number);
  
  // Create a base date and set the hours/minutes
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  // Add the duration
  const endDate = new Date(date.getTime() + durationHours * 60 * 60 * 1000);
  
  // Format the end time
  return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
};

export default EventDetailsPage;

import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Container, Tab, Nav, Image } from 'react-bootstrap';
import { getProfileImageUrl, handleImageError } from '../utils/imageUtils';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaEdit } from 'react-icons/fa';
import { 
  getUserProfile, 
  updateUserProfile, 
  clearError 
} from '../redux/slices/authSlice';
import { getAttendingEvents } from '../redux/slices/eventSlice';
import { getUserBookings } from '../redux/slices/bookingSlice';
import EventCard from '../components/events/EventCard';
import Loader from '../components/shared/Loader';
import Message from '../components/shared/Message';

const ProfilePage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const dispatch = useDispatch();

  const { userInfo, loading, error } = useSelector((state) => state.auth);
  const { attendingEvents, loading: eventsLoading } = useSelector((state) => state.events);
  const { bookings, loading: bookingsLoading } = useSelector((state) => state.bookings);

  useEffect(() => {
    if (!userInfo) {
      return;
    }

    dispatch(getUserProfile());
    dispatch(getAttendingEvents());
    dispatch(getUserBookings());

    setName(userInfo.name || '');
    setEmail(userInfo.email || '');
    setPhone(userInfo.phone || '');

    return () => {
      dispatch(clearError());
    };
  }, [dispatch, userInfo]);

  const submitHandler = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    // Prepare form data for image upload
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    
    if (password) {
      formData.append('password', password);
    }
    
    if (profileImage) {
      formData.append('profileImage', profileImage);
    }

    dispatch(updateUserProfile(formData))
      .unwrap()
      .then(() => {
        toast.success('Profile updated successfully');
        setPassword('');
        setConfirmPassword('');
      })
      .catch((error) => {
        toast.error(error || 'Failed to update profile');
      });
  };

  const handleProfileImageChange = (e) => {
    setProfileImage(e.target.files[0]);
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">My Profile</h1>

      <Row>
        <Col md={3}>
          <Card className="mb-4 shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3">
                <Image
                  src={getProfileImageUrl(userInfo?.profileImage)}
                  roundedCircle
                  width={150}
                  height={150}
                  className="mb-3"
                  style={{ objectFit: 'cover' }}
                  onError={handleImageError}
                />
              </div>
              <h4>{userInfo?.name}</h4>
              <p className="text-muted mb-1">
                {userInfo?.role === 'organizer'
                  ? 'Event Organizer'
                  : userInfo?.role === 'admin'
                  ? 'Administrator'
                  : 'Attendee'}
              </p>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Navigation</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Nav className="flex-column" variant="pills">
                <Nav.Link
                  active={activeTab === 'profile'}
                  onClick={() => setActiveTab('profile')}
                  className="rounded-0"
                >
                  <FaUser className="me-2" /> Profile Information
                </Nav.Link>
                <Nav.Link
                  active={activeTab === 'events'}
                  onClick={() => setActiveTab('events')}
                  className="rounded-0"
                >
                  <FaUser className="me-2" /> My Events
                </Nav.Link>
                <Nav.Link
                  active={activeTab === 'bookings'}
                  onClick={() => setActiveTab('bookings')}
                  className="rounded-0"
                >
                  <FaUser className="me-2" /> My Bookings
                </Nav.Link>
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        <Col md={9}>
          {activeTab === 'profile' && (
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">
                  <FaEdit className="me-2" /> Edit Profile
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                {message && <Message variant="danger">{message}</Message>}
                {error && <Message variant="danger">{error}</Message>}
                {loading && <Loader />}

                <Form onSubmit={submitHandler}>
                  <Form.Group className="mb-3" controlId="name">
                    <Form.Label>Full Name</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaUser />
                      </span>
                      <Form.Control
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Email Address</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaEnvelope />
                      </span>
                      <Form.Control
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="phone">
                    <Form.Label>Phone Number</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaPhone />
                      </span>
                      <Form.Control
                        type="tel"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="profileImage">
                    <Form.Label>Profile Image</Form.Label>
                    <Form.Control
                      type="file"
                      onChange={handleProfileImageChange}
                      accept="image/*"
                    />
                  </Form.Group>

                  <hr className="my-4" />

                  <h5 className="mb-3">Change Password</h5>
                  <p className="text-muted small mb-3">
                    Leave blank to keep your current password
                  </p>

                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>New Password</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaLock />
                      </span>
                      <Form.Control
                        type="password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="confirmPassword">
                    <Form.Label>Confirm New Password</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FaLock />
                      </span>
                      <Form.Control
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </Form.Group>

                  <Button variant="primary" type="submit">
                    Update Profile
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          )}

          {activeTab === 'events' && (
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">My Registered Events</h5>
              </Card.Header>
              <Card.Body className="p-4">
                {eventsLoading ? (
                  <Loader />
                ) : attendingEvents.length === 0 ? (
                  <Message variant="info">
                    You haven't registered for any events yet.
                  </Message>
                ) : (
                  <Row>
                    {attendingEvents.map((event) => (
                      <Col key={event._id} md={6} className="mb-4">
                        <EventCard event={event} />
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>
          )}

          {activeTab === 'bookings' && (
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">My Bookings</h5>
              </Card.Header>
              <Card.Body className="p-4">
                {bookingsLoading ? (
                  <Loader />
                ) : bookings.length === 0 ? (
                  <Message variant="info">
                    You don't have any bookings yet.
                  </Message>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Event</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking._id}>
                            <td>#{booking._id.substring(0, 8)}</td>
                            <td>{booking.event.title}</td>
                            <td>
                              {new Date(booking.bookingDate).toLocaleDateString()}
                            </td>
                            <td>৳{booking.totalAmount.toFixed(2)}</td>
                            <td>
                              <span
                                className={`badge bg-${
                                  booking.bookingStatus === 'confirmed'
                                    ? 'success'
                                    : booking.bookingStatus === 'pending'
                                    ? 'warning'
                                    : 'danger'
                                }`}
                              >
                                {booking.bookingStatus}
                              </span>
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                href={`/bookings/${booking._id}`}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;

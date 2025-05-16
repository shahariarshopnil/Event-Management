import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  getEventDetails, 
  updateEvent, 
  resetEventSuccess 
} from '../redux/slices/eventSlice';
import { getCategories } from '../redux/slices/categorySlice';
import FormContainer from '../components/shared/FormContainer';
import Message from '../components/shared/Message';
import Loader from '../components/shared/Loader';

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(0);
  const [maxAttendees, setMaxAttendees] = useState(50);
  const [eventImage, setEventImage] = useState(null);
  const [tags, setTags] = useState('');

  const { event, loading, error, success } = useSelector((state) => state.events);
  const { categories } = useSelector((state) => state.categories);
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getCategories());
    
    // Load event details if not already loaded or if different event
    if (!event || event._id !== id) {
      dispatch(getEventDetails(id));
    } else {
      // Populate form with event details
      setTitle(event.title);
      setDescription(event.description);
      setShortDescription(event.shortDescription);
      setDate(new Date(event.date));
      setEndDate(event.endDate ? new Date(event.endDate) : new Date(event.date));
      setTime(event.time);
      setEndTime(event.endTime || event.time);
      setLocation(event.location);
      setAddress(event.address);
      setCity(event.city);
      setState(event.state || '');
      setZipCode(event.zipCode || '');
      setCountry(event.country);
      setCategory(event.category._id);
      setPrice(event.price);
      setMaxAttendees(event.maxAttendees);
      setTags(event.tags ? event.tags.join(', ') : '');
    }

    if (success) {
      dispatch(resetEventSuccess());
      navigate(`/events/${id}`);
      toast.success('Event updated successfully!');
    }
  }, [dispatch, id, event, success, navigate]);

  // Check if user is authorized to edit this event
  useEffect(() => {
    if (event && userInfo && event.organizer) {
      if (event.organizer._id !== userInfo._id && userInfo.role !== 'admin') {
        toast.error('You are not authorized to edit this event');
        navigate('/events');
      }
    }
  }, [event, userInfo, navigate]);

  const submitHandler = (e) => {
    e.preventDefault();

    // Validate dates
    if (endDate < date) {
      toast.error('End date cannot be before start date');
      return;
    }

    // Create FormData for image upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('shortDescription', shortDescription);
    formData.append('date', date.toISOString());
    formData.append('endDate', endDate.toISOString());
    formData.append('time', time);
    formData.append('endTime', endTime);
    formData.append('location', location);
    formData.append('address', address);
    formData.append('city', city);
    formData.append('state', state);
    formData.append('zipCode', zipCode);
    formData.append('country', country);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('maxAttendees', maxAttendees);
    formData.append('tags', tags);
    
    if (eventImage) {
      formData.append('eventImage', eventImage);
    }

    dispatch(updateEvent({ id, eventData: formData }));
  };

  const handleImageChange = (e) => {
    setEventImage(e.target.files[0]);
  };

  return (
    <Container className="py-4">
      <FormContainer title="Edit Event">
        {error && <Message variant="danger">{error}</Message>}
        {loading ? (
          <Loader />
        ) : !event ? (
          <Message variant="info">Event not found</Message>
        ) : (
          <Form onSubmit={submitHandler}>
            <h4 className="mb-3">Basic Information</h4>
            <Form.Group className="mb-3" controlId="title">
              <Form.Label>Event Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="shortDescription">
                  <Form.Label>Short Description</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Brief description (max 200 characters)"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    maxLength={200}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="category">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="description">
              <Form.Label>Full Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Detailed description of the event"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="tags">
              <Form.Label>Tags (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. music, concert, live"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </Form.Group>

            <h4 className="mb-3 mt-4">Date & Time</h4>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="date">
                  <Form.Label>Start Date</Form.Label>
                  <DatePicker
                    selected={date}
                    onChange={(date) => setDate(date)}
                    className="form-control"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="time">
                  <Form.Label>Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="endDate">
                  <Form.Label>End Date</Form.Label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    className="form-control"
                    minDate={date}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="endTime">
                  <Form.Label>End Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <h4 className="mb-3 mt-4">Location</h4>
            <Form.Group className="mb-3" controlId="location">
              <Form.Label>Venue Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter venue name"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="address">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter street address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="city">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="state">
                  <Form.Label>State/Province</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter state or province"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="zipCode">
                  <Form.Label>Zip/Postal Code</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter zip or postal code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="country">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <h4 className="mb-3 mt-4">Tickets & Capacity</h4>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="price">
                  <Form.Label>Ticket Price (৳)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0 for free events"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="maxAttendees">
                  <Form.Label>Maximum Attendees</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    placeholder="Enter maximum capacity"
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4" controlId="eventImage">
              <Form.Label>Event Image (Leave empty to keep current image)</Form.Label>
              <Form.Control
                type="file"
                onChange={handleImageChange}
                accept="image/*"
              />
              <Form.Text className="text-muted">
                Upload a new image to replace the current one. Recommended size: 1200x630px.
              </Form.Text>
            </Form.Group>

            {event.eventImage && (
              <div className="mb-4">
                <h6>Current Image:</h6>
                <img
                  src={
                    event.eventImage.startsWith('http')
                      ? event.eventImage
                      : `http://localhost:5000/uploads/events/${event.eventImage}`
                  }
                  alt={event.title}
                  style={{ width: '200px', height: 'auto' }}
                  className="img-thumbnail"
                />
              </div>
            )}

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                Update Event
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => navigate(`/events/${id}`)}
              >
                Cancel
              </Button>
            </div>
          </Form>
        )}
      </FormContainer>
    </Container>
  );
};

export default EditEventPage;

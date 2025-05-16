import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Badge, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaPlus, FaTimes, FaTicketAlt, FaDollarSign, FaUsers } from 'react-icons/fa';
import { createEvent, resetEventSuccess } from '../redux/slices/eventSlice';
import { getCategories } from '../redux/slices/categorySlice';
import FormContainer from '../components/shared/FormContainer';
import Message from '../components/shared/Message';
import Loader from '../components/shared/Loader';

const CreateEventPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [time, setTime] = useState('18:00');
  const [endTime, setEndTime] = useState('21:00');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(1);
  const [maxAttendees, setMaxAttendees] = useState(50);
  const [eventImage, setEventImage] = useState(null);
  const [tags, setTags] = useState('');
  // All events are now paid by default - no free event option available
  
  // Package state
  const [packages, setPackages] = useState([
    {
      name: 'Basic',
      description: 'Standard entry ticket',
      price: 0,
      features: ['General admission', 'Standard seating'],
      maxBookings: 30,
      isActive: true
    },
    {
      name: 'Premium',
      description: 'Enhanced experience with additional perks',
      price: 50,
      features: ['Priority admission', 'Reserved seating', 'Event merchandise'],
      maxBookings: 15,
      isActive: true
    },
    {
      name: 'VIP',
      description: 'Ultimate experience with all benefits',
      price: 100,
      features: ['VIP entrance', 'Front row seats', 'Meet & greet', 'Exclusive gift bag', 'Complimentary drinks'],
      maxBookings: 5,
      isActive: true
    }
  ]);
  const [showNewPackageForm, setShowNewPackageForm] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    price: 0,
    features: [''],
    maxBookings: 10,
    isActive: true
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, success } = useSelector((state) => state.events);
  const categoriesState = useSelector((state) => state.categories);
  const { categories, loading: categoriesLoading } = categoriesState || { categories: [], loading: false };

  useEffect(() => {
    dispatch(getCategories());

    if (success) {
      dispatch(resetEventSuccess());
      navigate('/myevents');
      toast.success('Event created successfully!');
    }
  }, [dispatch, success, navigate]);

  // Package handlers
  const handlePackageChange = (index, field, value) => {
    const updatedPackages = [...packages];
    updatedPackages[index][field] = value;
    setPackages(updatedPackages);
  };

  const handleFeatureChange = (packageIndex, featureIndex, value) => {
    const updatedPackages = [...packages];
    updatedPackages[packageIndex].features[featureIndex] = value;
    setPackages(updatedPackages);
  };

  const addFeature = (packageIndex) => {
    const updatedPackages = [...packages];
    updatedPackages[packageIndex].features.push('');
    setPackages(updatedPackages);
  };

  const removeFeature = (packageIndex, featureIndex) => {
    const updatedPackages = [...packages];
    updatedPackages[packageIndex].features.splice(featureIndex, 1);
    setPackages(updatedPackages);
  };

  const removePackage = (index) => {
    if (packages.length <= 1) {
      toast.error('You must have at least one package');
      return;
    }
    const updatedPackages = [...packages];
    updatedPackages.splice(index, 1);
    setPackages(updatedPackages);
  };
  
  const handleNewPackageChange = (field, value) => {
    setNewPackage({ ...newPackage, [field]: value });
  };
  
  const handleNewFeatureChange = (index, value) => {
    const updatedFeatures = [...newPackage.features];
    updatedFeatures[index] = value;
    setNewPackage({ ...newPackage, features: updatedFeatures });
  };
  
  const addNewFeature = () => {
    setNewPackage({ 
      ...newPackage, 
      features: [...newPackage.features, '']
    });
  };
  
  const removeNewFeature = (index) => {
    if (newPackage.features.length <= 1) {
      toast.error('Package must have at least one feature');
      return;
    }
    const updatedFeatures = [...newPackage.features];
    updatedFeatures.splice(index, 1);
    setNewPackage({ ...newPackage, features: updatedFeatures });
  };
  
  const addPackage = () => {
    if (!newPackage.name.trim()) {
      toast.error('Package name is required');
      return;
    }
    setPackages([...packages, newPackage]);
    setNewPackage({
      name: '',
      description: '',
      price: 0,
      features: [''],
      maxBookings: 10,
      isActive: true
    });
    setShowNewPackageForm(false);
  };

  const submitHandler = (e) => {
    e.preventDefault();

    // Validate dates
    if (endDate < date) {
      toast.error('End date cannot be before start date');
      return;
    }
    
    // Validate price (must be at least 1)
    if (price < 1) {
      toast.error('Event price must be at least 1');
      return;
    }
    
    // Validate packages for the event
    if (!packages.length || packages.some(pkg => !pkg.name)) {
      toast.error('Please add at least one valid package for the event');
      return;
    }

    // Create FormData for image upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('shortDescription', `${title} - ${location}`); // Add default short description
    formData.append('date', date.toISOString());
    formData.append('endDate', endDate.toISOString());
    formData.append('time', time);
    formData.append('endTime', endTime);
    formData.append('location', location);
    formData.append('address', address);
    formData.append('city', city);
    formData.append('state', ''); // Add empty state
    formData.append('zipCode', ''); // Add empty zip code
    formData.append('country', 'Bangladesh'); // Add default country
    formData.append('category', category);
    formData.append('price', price);
    formData.append('maxAttendees', maxAttendees);
    formData.append('tags', tags);
    formData.append('packages', JSON.stringify(packages));
    
    if (eventImage) {
      formData.append('eventImage', eventImage);
    }

    dispatch(createEvent(formData));
  };

  const handleImageChange = (e) => {
    setEventImage(e.target.files[0]);
  };

  return (
    <Container className="py-4">
      <FormContainer title="Create New Event">
        {error && <Message variant="danger">{error}</Message>}
        {loading && <Loader />}
        
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
              <Form.Group className="mb-3" controlId="category">
                <Form.Label>Category</Form.Label>
                {categoriesLoading ? (
                  <div className="text-center py-2">Loading categories...</div>
                ) : (
                  <Form.Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories && categories.length > 0 ? (
                      categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>No categories available</option>
                    )}
                  </Form.Select>
                )}
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
                  minDate={new Date()}
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

          <h4 className="mb-3 mt-4">Tickets & Pricing</h4>
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Ticket Packages</h5>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={() => setShowNewPackageForm(!showNewPackageForm)}
              >
                <FaPlus className="me-1" /> Add New Package
              </Button>
            </div>
            
            {/* New Package Form */}
            {showNewPackageForm && (
              <Card className="mb-3 border-primary">
                <Card.Header className="bg-primary text-white">Create New Package</Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Package Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., Gold Package"
                          value={newPackage.name}
                          onChange={(e) => handleNewPackageChange('name', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Price (৳)</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">৳</span>
                          <Form.Control
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="Enter price"
                            value={newPackage.price}
                            onChange={(e) => handleNewPackageChange('price', parseFloat(e.target.value))}
                            required
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Describe what this package offers"
                      value={newPackage.description}
                      onChange={(e) => handleNewPackageChange('description', e.target.value)}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Available Tickets</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text"><FaTicketAlt /></span>
                      <Form.Control
                        type="number"
                        min="1"
                        placeholder="Number of tickets available"
                        value={newPackage.maxBookings}
                        onChange={(e) => handleNewPackageChange('maxBookings', parseInt(e.target.value))}
                        required
                      />
                    </div>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Features</Form.Label>
                    {newPackage.features.map((feature, idx) => (
                      <div key={idx} className="d-flex mb-2">
                        <Form.Control
                          type="text"
                          placeholder={`Feature ${idx + 1}`}
                          value={feature}
                          onChange={(e) => handleNewFeatureChange(idx, e.target.value)}
                          className="me-2"
                        />
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeNewFeature(idx)}
                        >
                          <FaTimes />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={addNewFeature} 
                      className="mt-2"
                    >
                      <FaPlus className="me-1" /> Add Feature
                    </Button>
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setShowNewPackageForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={addPackage}
                    >
                      Add Package
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
            
            {/* Existing Packages */}
            {packages.length > 0 ? (
              <Row>
                {packages.map((pkg, index) => (
                  <Col md={4} key={index} className="mb-3">
                    <Card className="h-100 shadow-sm">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">{pkg.name || `Package ${index + 1}`}</h6>
                        <Badge bg="primary">৳{pkg.price}</Badge>
                      </Card.Header>
                      <Card.Body>
                        <p className="small text-muted mb-3">
                          {pkg.description || 'No description provided'}
                        </p>
                        
                        <div className="mb-3">
                          <small className="text-muted d-block mb-1">Features:</small>
                          <ListGroup variant="flush" className="small">
                            {pkg.features.map((feature, featureIndex) => (
                              <ListGroup.Item key={featureIndex} className="p-0 border-0 mb-2">
                                <div className="d-flex">
                                  <Form.Control
                                    type="text"
                                    placeholder={`Feature ${featureIndex + 1}`}
                                    value={feature}
                                    onChange={(e) => handleFeatureChange(index, featureIndex, e.target.value)}
                                    className="me-2"
                                  />
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => removeFeature(index, featureIndex)}
                                  >
                                    <FaTimes />
                                  </Button>
                                </div>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                          <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            onClick={() => addFeature(index)}
                          >
                            <FaPlus className="me-1" /> Add Feature
                          </Button>
                        </div>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Price (৳)</Form.Label>
                          <div className="input-group">
                            <span className="input-group-text">৳</span>
                            <Form.Control
                              type="number"
                              min="1"
                              step="0.01"
                              placeholder="Enter price"
                              value={pkg.price}
                              onChange={(e) => handlePackageChange(index, 'price', parseFloat(e.target.value))}
                              required
                            />
                          </div>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Available Tickets</Form.Label>
                          <div className="input-group">
                            <span className="input-group-text"><FaTicketAlt /></span>
                            <Form.Control
                              type="number"
                              min="1"
                              placeholder="Number of tickets available"
                              value={pkg.maxBookings}
                              onChange={(e) => handlePackageChange(index, 'maxBookings', parseInt(e.target.value))}
                              required
                            />
                          </div>
                        </Form.Group>
                      </Card.Body>
                      <Card.Footer className="bg-white">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="w-100"
                          onClick={() => removePackage(index)}
                        >
                          <FaTimes className="me-1" /> Remove Package
                        </Button>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Card className="text-center p-4 mb-3">
                <Card.Body>
                  <p className="mb-2">No ticket packages created yet.</p>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => setShowNewPackageForm(true)}
                  >
                    <FaPlus className="me-1" /> Add Your First Package
                  </Button>
                </Card.Body>
              </Card>
            )}
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="price">
                  <Form.Label>Base Event Price (৳)</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">৳</span>
                    <Form.Control
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Enter base price"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      required
                    />
                  </div>
                  <Form.Text className="text-muted">
                    The standard price for event entry. Must be at least 1.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="maxAttendees">
                  <Form.Label>Total Event Capacity</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text"><FaUsers /></span>
                    <Form.Control
                      type="number"
                      min="1"
                      placeholder="Enter maximum overall capacity"
                      value={maxAttendees}
                      onChange={(e) => setMaxAttendees(e.target.value)}
                      required
                    />
                    <Form.Text className="text-muted">
                      This is the total capacity for all packages combined.
                    </Form.Text>
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </div>

          <Form.Group className="mb-4" controlId="eventImage">
            <Form.Label>Event Image</Form.Label>
            <Form.Control
              type="file"
              onChange={handleImageChange}
              accept="image/*"
            />
            <Form.Text className="text-muted">
              Upload an image for your event. Recommended size: 1200x630px.
            </Form.Text>
          </Form.Group>

          <div className="d-grid">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Creating Event...' : 'Create Event'}
            </Button>
          </div>
        </Form>
      </FormContainer>
    </Container>
  );
};

export default CreateEventPage;

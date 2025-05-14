import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Collapse, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaSearch, FaFilter, FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaDollarSign, FaClock, FaTag } from 'react-icons/fa';
import { getCategories } from '../../redux/slices/categorySlice';

const EventFilter = ({ onFilter }) => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories);

  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [maxPrice, setMaxPrice] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  
  // Cities for location filter - normally this would come from the API
  const cities = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Francisco',
    'Austin', 'Seattle', 'Denver', 'Boston', 'Nashville'
  ];

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);
  
  // Update active filters badge list whenever filters change
  useEffect(() => {
    const newActiveFilters = [];
    
    if (categoryId) {
      const category = categories.find(c => c._id === categoryId);
      if (category) {
        newActiveFilters.push({ type: 'category', value: category.name });
      }
    }
    
    if (date) {
      newActiveFilters.push({ 
        type: 'date', 
        value: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
    }
    
    if (dateRange.startDate && dateRange.endDate) {
      newActiveFilters.push({ 
        type: 'dateRange', 
        value: `${dateRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${dateRange.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      });
    }
    
    if (minPrice) {
      newActiveFilters.push({ type: 'minPrice', value: `Min $${minPrice}` });
    }
    
    if (maxPrice) {
      newActiveFilters.push({ type: 'maxPrice', value: `Max $${maxPrice}` });
    }
    
    if (status) {
      newActiveFilters.push({ 
        type: 'status', 
        value: status.charAt(0).toUpperCase() + status.slice(1) 
      });
    }
    
    if (location) {
      newActiveFilters.push({ type: 'location', value: location });
    }
    
    setActiveFilters(newActiveFilters);
  }, [categories, categoryId, date, dateRange, minPrice, maxPrice, status, location]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const filters = {
      keyword,
      category: categoryId,
      date: date ? date.toISOString() : '',
      startDate: dateRange.startDate ? dateRange.startDate.toISOString() : '',
      endDate: dateRange.endDate ? dateRange.endDate.toISOString() : '',
      minPrice,
      maxPrice,
      status,
      location,
    };
    
    onFilter(filters);
  };

  const handleReset = () => {
    setKeyword('');
    setCategoryId('');
    setDate(null);
    setDateRange({ startDate: null, endDate: null });
    setMinPrice('');
    setMaxPrice('');
    setStatus('');
    setLocation('');
    
    onFilter({
      keyword: '',
      category: '',
      date: '',
      startDate: '',
      endDate: '',
      minPrice: '',
      maxPrice: '',
      status: '',
      location: '',
    });
  };
  
  // Remove a specific filter
  const removeFilter = (type) => {
    switch (type) {
      case 'category':
        setCategoryId('');
        break;
      case 'date':
        setDate(null);
        break;
      case 'dateRange':
        setDateRange({ startDate: null, endDate: null });
        break;
      case 'minPrice':
        setMinPrice('');
        break;
      case 'maxPrice':
        setMaxPrice('');
        break;
      case 'status':
        setStatus('');
        break;
      case 'location':
        setLocation('');
        break;
      default:
        break;
    }
    
    // Submit the form to update results
    setTimeout(() => {
      document.getElementById('filterForm').dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    }, 0);
  };

  return (
    <Card className="shadow-sm mb-4">
      <Card.Body>
        <Form id="filterForm" onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={9}>
              <Form.Group controlId="keyword">
                <div className="input-group">
                  <span className="input-group-text bg-primary text-white">
                    <FaSearch />
                  </span>
                  <Form.Control
                    type="text"
                    placeholder="Search events by title, description, or location..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                  <Button variant="primary" type="submit">
                    Search
                  </Button>
                </div>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-center">
              <Button
                variant={isAdvancedFilterOpen ? "primary" : "outline-primary"}
                className="w-100"
                onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              >
                <FaFilter className="me-2" /> {isAdvancedFilterOpen ? 'Hide Filters' : 'Advanced Filters'}
              </Button>
            </Col>
          </Row>
          
          {/* Active Filters Display */}
          {activeFilters.length > 0 && (
            <div className="mb-3">
              <div className="d-flex flex-wrap gap-2">
                {activeFilters.map((filter, index) => (
                  <Badge 
                    key={index} 
                    bg="light" 
                    text="dark" 
                    className="d-flex align-items-center p-2 border"
                  >
                    {filter.value}
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 ms-2 text-danger" 
                      onClick={() => removeFilter(filter.type)}
                    >
                      <FaTimes />
                    </Button>
                  </Badge>
                ))}
                
                {activeFilters.length > 0 && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 ms-2 text-secondary" 
                    onClick={handleReset}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          )}

          <Collapse in={isAdvancedFilterOpen}>
            <div>
              <Card className="bg-light mb-3">
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <Form.Group controlId="category" className="mb-3">
                        <Form.Label className="d-flex align-items-center">
                          <FaTag className="me-2 text-primary" /> Category
                        </Form.Label>
                        <Form.Select
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                        >
                          <option value="">All Categories</option>
                          {categories.map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId="date" className="mb-3">
                        <Form.Label className="d-flex align-items-center">
                          <FaCalendarAlt className="me-2 text-primary" /> Date
                        </Form.Label>
                        <DatePicker
                          selected={date}
                          onChange={(date) => setDate(date)}
                          className="form-control"
                          placeholderText="Select specific date"
                          minDate={new Date()}
                          isClearable
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId="dateRange" className="mb-3">
                        <Form.Label className="d-flex align-items-center">
                          <FaCalendarAlt className="me-2 text-primary" /> Date Range
                        </Form.Label>
                        <div className="d-flex">
                          <DatePicker
                            selected={dateRange.startDate}
                            onChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                            className="form-control me-2"
                            placeholderText="From"
                            selectsStart
                            startDate={dateRange.startDate}
                            endDate={dateRange.endDate}
                            isClearable
                          />
                          <DatePicker
                            selected={dateRange.endDate}
                            onChange={(date) => setDateRange({ ...dateRange, endDate: date })}
                            className="form-control"
                            placeholderText="To"
                            selectsEnd
                            startDate={dateRange.startDate}
                            endDate={dateRange.endDate}
                            minDate={dateRange.startDate}
                            isClearable
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={4}>
                      <Form.Group controlId="location" className="mb-3">
                        <Form.Label className="d-flex align-items-center">
                          <FaMapMarkerAlt className="me-2 text-primary" /> Location
                        </Form.Label>
                        <Form.Select
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        >
                          <option value="">All Locations</option>
                          {cities.map((city, index) => (
                            <option key={index} value={city}>
                              {city}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId="price" className="mb-3">
                        <Form.Label className="d-flex align-items-center">
                          <FaDollarSign className="me-2 text-primary" /> Price Range (All events are paid)
                        </Form.Label>
                        <div className="d-flex">
                          <div className="input-group me-2">
                            <span className="input-group-text">$</span>
                            <Form.Control
                              type="number"
                              placeholder="Min"
                              value={minPrice}
                              onChange={(e) => setMinPrice(e.target.value)}
                              min="1"
                            />
                          </div>
                          <div className="input-group">
                            <span className="input-group-text">$</span>
                            <Form.Control
                              type="number"
                              placeholder="Max"
                              value={maxPrice}
                              onChange={(e) => setMaxPrice(e.target.value)}
                              min="1"
                            />
                          </div>
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId="status" className="mb-3">
                        <Form.Label className="d-flex align-items-center">
                          <FaClock className="me-2 text-primary" /> Status
                        </Form.Label>
                        <Form.Select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                        >
                          <option value="">All Statuses</option>
                          <option value="upcoming">Upcoming</option>
                          <option value="ongoing">Ongoing</option>
                          <option value="completed">Completed</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <div className="d-flex justify-content-end mt-2">
                    <Button variant="outline-secondary" onClick={handleReset} className="me-2">
                      <FaTimes className="me-1" /> Reset
                    </Button>
                    <Button variant="primary" type="submit">
                      <FaSearch className="me-1" /> Apply Filters
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Collapse>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default EventFilter;

/* Add this to your App.css if needed
.input-group .form-control:focus,
.input-group .btn:focus {
  z-index: 1;
}
*/

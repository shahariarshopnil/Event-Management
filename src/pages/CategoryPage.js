import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Breadcrumb, Button, Form } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getEvents } from '../redux/slices/eventSlice';
import { getCategoryById } from '../redux/slices/categorySlice';
import EventCard from '../components/events/EventCard';
import Loader from '../components/shared/Loader';
import Message from '../components/shared/Message';
import { FaFilter, FaSort, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';

const CategoryPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  
  const { events, loading: eventsLoading, error: eventsError, pages, page } = useSelector((state) => state.events);
  const { category, loading: categoryLoading, error: categoryError } = useSelector((state) => state.categories);

  const [sortBy, setSortBy] = useState('date');
  const [filterDate, setFilterDate] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterPrice, setFilterPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(getCategoryById(id));
    
    const filters = {
      category: id,
      pageNumber: currentPage,
    };
    
    if (filterDate) {
      filters.date = filterDate;
    }
    
    if (filterLocation) {
      filters.location = filterLocation;
    }
    
    if (filterPrice) {
      filters.maxPrice = filterPrice;
    }
    
    dispatch(getEvents(filters));
  }, [dispatch, id, filterDate, filterLocation, filterPrice, currentPage]);

  // Sort events based on selected criterion
  const sortedEvents = [...events].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.date) - new Date(b.date);
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  // Get unique locations for filter
  const locations = [...new Set(events.map(event => event.city))];

  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
  };

  const handleResetFilters = () => {
    setFilterDate('');
    setFilterLocation('');
    setFilterPrice('');
    setSortBy('date');
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Container className="py-4">
      {categoryLoading ? (
        <Loader />
      ) : categoryError ? (
        <Message variant="danger">{categoryError}</Message>
      ) : !category ? (
        <Message variant="info">Category not found</Message>
      ) : (
        <>
          {/* Category Header */}
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold">{category.name}</h1>
            <p className="lead text-muted">{category.description}</p>
            <Breadcrumb className="justify-content-center">
              <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
                Home
              </Breadcrumb.Item>
              <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/events' }}>
                Events
              </Breadcrumb.Item>
              <Breadcrumb.Item active>{category.name}</Breadcrumb.Item>
            </Breadcrumb>
          </div>

          {/* Filter and Sort Section */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Button 
                  variant="outline-primary" 
                  onClick={handleFilterToggle}
                  className="d-flex align-items-center"
                >
                  <FaFilter className="me-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
                
                <div className="d-flex align-items-center">
                  <FaSort className="me-2 text-muted" />
                  <Form.Select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="form-select-sm"
                    style={{ width: 'auto' }}
                  >
                    <option value="date">Date (Soonest)</option>
                    <option value="price-low">Price (Low to High)</option>
                    <option value="price-high">Price (High to Low)</option>
                    <option value="name">Name (A-Z)</option>
                  </Form.Select>
                </div>
              </div>
              
              {showFilters && (
                <div className="pt-2">
                  <Row>
                    <Col md={4} className="mb-3 mb-md-0">
                      <Form.Group>
                        <Form.Label className="d-flex align-items-center">
                          <FaCalendarAlt className="me-2 text-primary" />
                          Date
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={filterDate}
                          onChange={(e) => setFilterDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4} className="mb-3 mb-md-0">
                      <Form.Group>
                        <Form.Label className="d-flex align-items-center">
                          <FaMapMarkerAlt className="me-2 text-primary" />
                          Location
                        </Form.Label>
                        <Form.Select
                          value={filterLocation}
                          onChange={(e) => setFilterLocation(e.target.value)}
                        >
                          <option value="">All Locations</option>
                          {locations.map((location) => (
                            <option key={location} value={location}>
                              {location}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Max Price</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          value={filterPrice}
                          onChange={(e) => setFilterPrice(e.target.value)}
                          placeholder="Any price"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="d-flex justify-content-end mt-3">
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={handleResetFilters}
                      className="me-2"
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Events Section */}
          {eventsLoading ? (
            <Loader />
          ) : eventsError ? (
            <Message variant="danger">{eventsError}</Message>
          ) : sortedEvents.length === 0 ? (
            <Card className="text-center p-5">
              <Card.Body>
                <h3 className="mb-3">No events found in this category</h3>
                <p className="text-muted mb-4">
                  Try adjusting your filters or check back later for new events.
                </p>
                <Button 
                  variant="primary" 
                  as={Link} 
                  to="/events"
                >
                  Browse All Events
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <>
              <Row>
                {sortedEvents.map((event) => (
                  <Col key={event._id} md={6} lg={4} className="mb-4">
                    <EventCard event={event} />
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              {pages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <ul className="pagination">
                    {[...Array(pages).keys()].map((x) => (
                      <li
                        key={x + 1}
                        className={`page-item ${x + 1 === page ? 'active' : ''}`}
                      >
                        <Button
                          className="page-link"
                          onClick={() => handlePageChange(x + 1)}
                        >
                          {x + 1}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default CategoryPage;

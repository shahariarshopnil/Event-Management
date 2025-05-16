import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Pagination, Button, ButtonGroup, Card, Form, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import { FaThLarge, FaList, FaSort, FaSortAmountDown, FaSortAmountUp, FaCalendar, FaTicketAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import { getEvents } from '../redux/slices/eventSlice';
import EventCard from '../components/events/EventCard';
import EventFilter from '../components/events/EventFilter';
import Loader from '../components/shared/Loader';
import Message from '../components/shared/Message';

const EventsPage = () => {
  const dispatch = useDispatch();
  const { events, loading, error, page, pages } = useSelector(
    (state) => state.events
  );
  const { categories } = useSelector((state) => state.categories);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // View state
  const [viewMode, setViewMode] = useState(searchParams.get('view') || 'grid');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'date-asc');
  
  // Filters state
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    category: searchParams.get('category') || '',
    date: searchParams.get('date') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    status: searchParams.get('status') || '',
    location: searchParams.get('location') || '',
    pageNumber: searchParams.get('page') || 1,
  });

  useEffect(() => {
    // Get sorting parameters from the sort value
    const [sortField, sortDirection] = sortBy.split('-');
    
    // Update the filters with sorting information
    const filtersWithSort = {
      ...filters,
      sortBy: sortField,
      sortDirection: sortDirection,
    };
    
    dispatch(getEvents(filtersWithSort));
  }, [dispatch, filters, sortBy]);

  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...newFilters, pageNumber: 1 };
    setFilters(updatedFilters);
    
    // Update URL search params
    const params = new URLSearchParams(searchParams);
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, pageNumber: newPage }));
    
    // Update URL search params
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    setSearchParams(params);
  };
  
  const handleViewChange = (view) => {
    setViewMode(view);
    
    // Update URL search params
    const params = new URLSearchParams(searchParams);
    params.set('view', view);
    setSearchParams(params);
  };
  
  const handleSortChange = (e) => {
    const newSortBy = e.target.value;
    setSortBy(newSortBy);
    
    // Update URL search params
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSortBy);
    setSearchParams(params);
  };
  
  // Function to get category name by id
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c._id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  // Sort events client-side for display (server-side sorting is still primary)
  const getSortedEvents = () => {
    if (!events.length) return [];
    
    return [...events].sort((a, b) => {
      const [field, direction] = sortBy.split('-');
      const isAsc = direction === 'asc';
      
      switch (field) {
        case 'date':
          return isAsc 
            ? new Date(a.date) - new Date(b.date) 
            : new Date(b.date) - new Date(a.date);
        case 'price':
          return isAsc 
            ? a.price - b.price 
            : b.price - a.price;
        case 'popularity':
          const aAttendees = a.attendees ? a.attendees.length : 0;
          const bAttendees = b.attendees ? b.attendees.length : 0;
          return isAsc 
            ? aAttendees - bAttendees 
            : bAttendees - aAttendees;
        case 'name':
          return isAsc 
            ? a.title.localeCompare(b.title) 
            : b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
  };
  
  // Get sorted events
  const sortedEvents = getSortedEvents();

  return (
    <Container className="py-4">
      <h1 className="mb-4">Browse Events</h1>
      
      <EventFilter onFilter={handleFilterChange} />
      
      {loading ? (
        <div className="text-center py-4">
          <Loader />
        </div>
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : events.length === 0 ? (
        <Message variant="info">
          No events found. Try adjusting your filters.
        </Message>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <p className="mb-0">
                Showing {events.length} of {pages * events.length} events
              </p>
            </div>
            
            <div className="d-flex">
              <Form.Group controlId="sortBy" className="me-3">
                <div className="d-flex align-items-center">
                  <FaSort className="me-2 text-muted" />
                  <Form.Select 
                    size="sm" 
                    value={sortBy} 
                    onChange={handleSortChange}
                    style={{ width: 'auto' }}
                  >
                    <option value="date-asc">Date (Soonest First)</option>
                    <option value="date-desc">Date (Latest First)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                    <option value="popularity-desc">Popularity</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </Form.Select>
                </div>
              </Form.Group>
              
              <ButtonGroup>
                <Button 
                  variant={viewMode === 'grid' ? 'primary' : 'outline-primary'} 
                  onClick={() => handleViewChange('grid')}
                >
                  <FaThLarge />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'primary' : 'outline-primary'} 
                  onClick={() => handleViewChange('list')}
                >
                  <FaList />
                </Button>
              </ButtonGroup>
            </div>
          </div>
          
          {viewMode === 'grid' ? (
            <Row>
              {sortedEvents.map((event) => (
                <Col key={event._id} lg={4} md={6} className="mb-4">
                  <EventCard event={event} />
                </Col>
              ))}
            </Row>
          ) : (
            <div className="list-view">
              {sortedEvents.map((event) => (
                <Card key={event._id} className="mb-3 shadow-sm hover-effect">
                  <div className="d-flex flex-column flex-md-row">
                    <div 
                      className="list-event-image" 
                      style={{
                        backgroundImage: `url(${event.eventImage?.startsWith('http') 
                          ? event.eventImage 
                          : `http://localhost:5000/uploads/events/${event.eventImage}`})`
                      }}
                    >
                      <Badge 
                        bg={event.price > 0 ? 'primary' : 'success'} 
                        className="m-2 price-badge"
                      >
                        {event.price > 0 ? `$${event.price}` : 'Free'}
                      </Badge>
                    </div>
                    <div className="p-3 flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5>
                            <Link to={`/events/${event._id}`} className="text-decoration-none">
                              {event.title}
                            </Link>
                          </h5>
                          <div className="mb-2">
                            <Badge bg="secondary" className="me-2">
                              {getCategoryName(event.category)}
                            </Badge>
                            <Badge 
                              bg={event.status === 'upcoming' ? 'success' : 
                                event.status === 'ongoing' ? 'warning' : 'secondary'}
                            >
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="d-flex align-items-center mb-1">
                            <FaCalendar className="me-1 text-muted" />
                            <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="d-flex align-items-center">
                            <FaTicketAlt className="me-1 text-muted" />
                            <span>
                              {event.availableSlots} / {event.maxAttendees} available
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 mb-2">{event.shortDescription}</p>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div className="text-muted">
                          <small>{event.location}, {event.city}</small>
                        </div>
                        <Link to={`/events/${event._id}`} className="btn btn-sm btn-outline-primary">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First
                  onClick={() => handlePageChange(1)}
                  disabled={page === 1}
                />
                <Pagination.Prev
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                />
                
                {[...Array(pages).keys()].map((x) => (
                  <Pagination.Item
                    key={x + 1}
                    active={x + 1 === page}
                    onClick={() => handlePageChange(x + 1)}
                  >
                    {x + 1}
                  </Pagination.Item>
                ))}
                
                <Pagination.Next
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pages}
                />
                <Pagination.Last
                  onClick={() => handlePageChange(pages)}
                  disabled={page === pages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default EventsPage;

/* Add this CSS to your App.css file
.list-event-image {
  width: 230px;
  min-height: 180px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.price-badge {
  position: absolute;
  top: 0;
  right: 0;
}

.hover-effect {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-effect:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  .list-event-image {
    width: 100%;
    height: 200px;
  }
}
*/

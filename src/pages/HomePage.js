import React, { useEffect } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaCalendarAlt, FaUsers, FaTicketAlt } from 'react-icons/fa';
import { getFeaturedEvents, getUpcomingEvents } from '../redux/slices/eventSlice';
import { getCategories } from '../redux/slices/categorySlice';
import EventCard from '../components/events/EventCard';
import Loader from '../components/shared/Loader';
import Message from '../components/shared/Message';

const HomePage = () => {
  const dispatch = useDispatch();
  const { featuredEvents, upcomingEvents, loading, error } = useSelector(
    (state) => state.events
  );
  const { categories } = useSelector((state) => state.categories);

  useEffect(() => {
    dispatch(getFeaturedEvents());
    dispatch(getUpcomingEvents());
    dispatch(getCategories());
  }, [dispatch]);

  return (
    <>
      {/* Hero Section */}
      <section className="py-5 text-center bg-primary text-white">
        <Container>
          <Row className="py-5">
            <Col md={8} className="mx-auto">
              <h1 className="display-4 fw-bold mb-4">
                Find, Organize & Book Amazing Events
              </h1>
              <p className="lead mb-4">
                Discover events that match your passions, create your own events,
                or book tickets to attend the most exciting happenings near you.
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Link to="/events">
                  <Button variant="light" size="lg">
                    <FaTicketAlt className="me-2" />
                    Browse Events
                  </Button>
                </Link>
                <Link to="/events/create">
                  <Button variant="outline-light" size="lg">
                    <FaCalendarAlt className="me-2" />
                    Create Event
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Events Section */}
      <section className="py-5">
        <Container>
          <h2 className="mb-4 text-center">Featured Events</h2>
          {loading ? (
            <div className="text-center py-4">
              <Loader />
            </div>
          ) : error ? (
            <Message variant="danger">{error}</Message>
          ) : featuredEvents.length === 0 ? (
            <Message variant="info">No featured events available.</Message>
          ) : (
            <Row>
              {featuredEvents.map((event) => (
                <Col key={event._id} md={4} className="mb-4">
                  <EventCard event={event} />
                </Col>
              ))}
            </Row>
          )}
          <div className="text-center mt-3">
            <Link to="/events">
              <Button variant="outline-primary">View All Events</Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Categories Section */}
      <section className="py-5 bg-light">
        <Container>
          <h2 className="mb-4 text-center">Browse by Category</h2>
          <Row>
            {categories.slice(0, 6).map((category) => (
              <Col key={category._id} md={2} sm={4} xs={6} className="mb-4">
                <Link
                  to={`/categories/${category._id}`}
                  className="text-decoration-none"
                >
                  <Card
                    className="text-center h-100 hover-shadow transition-all"
                    style={{ borderLeft: `4px solid ${category.color}` }}
                  >
                    <Card.Body>
                      <div
                        className="mb-3 mx-auto d-flex align-items-center justify-content-center"
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          backgroundColor: `${category.color}20`,
                        }}
                      >
                        <img
                          src={`http://localhost:5000/uploads/categories/${category.icon}`}
                          alt={category.name}
                          width="30"
                          height="30"
                          onError={(e) => {
                            e.target.src = '/logo192.png'; // Using the default React logo as fallback
                          }}
                        />
                      </div>
                      <Card.Title className="fs-6 mb-0">
                        {category.name}
                      </Card.Title>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
          <div className="text-center mt-3">
            <Link to="/categories">
              <Button variant="outline-primary">View All Categories</Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-5">
        <Container>
          <h2 className="mb-4 text-center">Upcoming Events</h2>
          {loading ? (
            <div className="text-center py-4">
              <Loader />
            </div>
          ) : error ? (
            <Message variant="danger">{error}</Message>
          ) : upcomingEvents.length === 0 ? (
            <Message variant="info">No upcoming events available.</Message>
          ) : (
            <Row>
              {upcomingEvents.slice(0, 3).map((event) => (
                <Col key={event._id} md={4} className="mb-4">
                  <EventCard event={event} />
                </Col>
              ))}
            </Row>
          )}
          <div className="text-center mt-3">
            <Link to="/events">
              <Button variant="outline-primary">View All Events</Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Call to Action Section */}
      <section className="py-5 bg-primary text-white text-center">
        <Container>
          <Row className="justify-content-center">
            <Col md={8}>
              <h2 className="mb-4">Start Organizing Your Events Today</h2>
              <p className="lead mb-4">
                Create, manage, and promote your events with our powerful event
                management platform.
              </p>
              <Link to="/register">
                <Button variant="light" size="lg">
                  <FaUsers className="me-2" />
                  Sign Up Now
                </Button>
              </Link>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default HomePage;

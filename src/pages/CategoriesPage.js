import React, { useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaCalendarAlt } from 'react-icons/fa';
import Loader from '../components/shared/Loader';
import Message from '../components/shared/Message';

// This assumes you have a categories slice with a getCategories action
// You may need to create this if it doesn't exist
const CategoriesPage = () => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector((state) => state.categories || { categories: [] });

  useEffect(() => {
    // Uncomment once you have the action implemented
    // dispatch(getCategories());
  }, [dispatch]);

  return (
    <Container className="py-4">
      <h1 className="mb-4">Event Categories</h1>
      
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Row>
          {categories && categories.length > 0 ? (
            categories.map((category) => (
              <Col key={category._id} sm={6} md={4} lg={3} className="mb-4">
                <Card className="h-100 shadow-sm category-card">
                  <Card.Body className="d-flex flex-column">
                    <div className="text-center mb-3">
                      <div className="category-icon mb-3">
                        <FaCalendarAlt size={30} />
                      </div>
                      <Card.Title as="h5">{category.name}</Card.Title>
                    </div>
                    <Card.Text className="text-muted small flex-grow-1">
                      {category.description || 'Explore events in this category.'}
                    </Card.Text>
                    <div className="mt-3 text-center">
                      <Link
                        to={`/categories/${category._id}`}
                        className="btn btn-outline-primary btn-sm w-100"
                      >
                        View Events
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col className="text-center py-5">
              <p className="lead text-muted">No categories found.</p>
            </Col>
          )}
        </Row>
      )}
    </Container>
  );
};

export default CategoriesPage;

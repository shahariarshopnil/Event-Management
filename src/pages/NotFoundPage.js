import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHome, FaSearch } from 'react-icons/fa';

const NotFoundPage = () => {
  return (
    <Container className="py-5 text-center">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <div className="mb-4">
            <div className="display-1 text-muted mb-3">404</div>
            <h1 className="h3 mb-3">Page Not Found</h1>
            <p className="lead text-muted mb-4">
              The page you are looking for might have been removed, had its name changed,
              or is temporarily unavailable.
            </p>
          </div>
          <div className="d-flex justify-content-center gap-3">
            <Button as={Link} to="/" variant="primary">
              <FaHome className="me-2" /> Go Home
            </Button>
            <Button as={Link} to="/events" variant="outline-primary">
              <FaSearch className="me-2" /> Browse Events
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage;

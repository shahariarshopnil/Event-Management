import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-white py-5 mt-auto">
      <Container>
        <Row className="mb-4">
          <Col md={4} className="mb-4 mb-md-0">
            <h5 className="mb-3">EventHub</h5>
            <p className="mb-3">
              The ultimate platform for managing and discovering events. Create, book, and
              manage your events with ease.
            </p>
            <div className="d-flex gap-3 fs-5">
              <a href="#" className="text-white">
                <FaFacebook />
              </a>
              <a href="#" className="text-white">
                <FaTwitter />
              </a>
              <a href="#" className="text-white">
                <FaInstagram />
              </a>
              <a href="#" className="text-white">
                <FaLinkedin />
              </a>
            </div>
          </Col>
          <Col md={2} className="mb-4 mb-md-0">
            <h5 className="mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-white text-decoration-none">
                  Home
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/events" className="text-white text-decoration-none">
                  Events
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/categories" className="text-white text-decoration-none">
                  Categories
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/about" className="text-white text-decoration-none">
                  About Us
                </Link>
              </li>
            </ul>
          </Col>
          <Col md={3} className="mb-4 mb-md-0">
            <h5 className="mb-3">For Organizers</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/events/create" className="text-white text-decoration-none">
                  Create Event
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/myevents" className="text-white text-decoration-none">
                  Manage Events
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/organizer-guide" className="text-white text-decoration-none">
                  Organizer Guide
                </Link>
              </li>
            </ul>
          </Col>
          <Col md={3}>
            <h5 className="mb-3">Contact</h5>
            <address className="mb-0">
              <p className="mb-2">123 Event Street</p>
              <p className="mb-2">New York, NY 10001</p>
              <p className="mb-2">Email: info@eventhub.com</p>
              <p className="mb-2">Phone: +1 (123) 456-7890</p>
            </address>
          </Col>
        </Row>
        <hr className="my-4" />
        <Row>
          <Col className="text-center">
            <p className="mb-0">
              &copy; {currentYear} EventHub. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;

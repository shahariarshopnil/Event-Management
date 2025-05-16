import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
// Temporarily replacing LinkContainer with native Link until router-bootstrap is fixed
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaUser, FaBell, FaCalendar, FaSignOutAlt } from 'react-icons/fa';
import { logout } from '../../redux/slices/authSlice';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);

  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll event to change navbar style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const logoutHandler = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Navbar
      bg={isScrolled ? 'light' : 'dark'}
      variant={isScrolled ? 'light' : 'dark'}
      expand="lg"
      fixed="top"
      className={`py-3 ${isScrolled ? 'shadow-sm' : 'shadow'} transition-all`}
      style={{ zIndex: 1030 }}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold fs-4">EventHub</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/events">Events</Nav.Link>
            <Nav.Link as={Link} to="/categories">Categories</Nav.Link>
            
            {/* Organizer-specific navigation links */}
            {userInfo && (userInfo.role === 'organizer' || userInfo.role === 'admin') && (
              <>
                <Nav.Link as={Link} to="/events/create" className="highlight-nav-item">
                  <Badge bg="primary" className="me-1">Organizer</Badge> Create Event
                </Nav.Link>
                <Nav.Link as={Link} to="/myevents">
                  My Events
                </Nav.Link>
              </>
            )}

            {userInfo ? (
              <>
                {/* Notifications Dropdown */}
                <Nav.Link as={Link} to="/notifications" className="position-relative">
                  <FaBell />
                  {unreadCount > 0 && (
                    <Badge
                      pill
                      bg="danger"
                      className="position-absolute top-0 start-100 translate-middle"
                      style={{ fontSize: '0.6rem' }}
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Nav.Link>

                {/* User Menu Dropdown */}
                <NavDropdown
                  title={
                    <span>
                      <FaUser className="me-1" />
                      {userInfo.name}
                    </span>
                  }
                  id="username"
                >
                  <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
                  
                  <NavDropdown.Item as={Link} to="/bookings">
                    <FaCalendar className="me-2" /> My Bookings
                  </NavDropdown.Item>
                  
                  {/* Display role badge */}
                  <NavDropdown.Divider />
                  <NavDropdown.Item disabled>
                    {userInfo.role === 'organizer' ? (
                      <Badge bg="primary" className="w-100 py-2">Organizer Account</Badge>
                    ) : userInfo.role === 'admin' ? (
                      <Badge bg="danger" className="w-100 py-2">Administrator</Badge>
                    ) : (
                      <Badge bg="info" className="w-100 py-2">Attendee Account</Badge>
                    )}
                  </NavDropdown.Item>
                  
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={logoutHandler}>
                    <FaSignOutAlt className="me-2" /> Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;

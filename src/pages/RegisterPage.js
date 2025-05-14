import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaBuilding } from 'react-icons/fa';
import { register, clearError } from '../redux/slices/authSlice';
import FormContainer from '../components/shared/FormContainer';
import Message from '../components/shared/Message';
import Loader from '../components/shared/Loader';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('user');
  const [message, setMessage] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, error, userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    // If already logged in, redirect to home
    if (userInfo) {
      navigate('/');
    }
    
    // Clear errors when component unmounts
    return () => {
      dispatch(clearError());
    };
  }, [userInfo, navigate, dispatch]);

  const submitHandler = (e) => {
    e.preventDefault();
    
    // Validate form
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }
    
    // Clear any previous validation messages
    setMessage(null);
    
    // Dispatch register action
    dispatch(register({ name, email, password, phone, role }));
  };

  return (
    <FormContainer title="Create Account">
      {message && <Message variant="danger">{message}</Message>}
      {error && <Message variant="danger">{error}</Message>}
      {loading && <Loader />}
      
      <Form onSubmit={submitHandler}>
        <Form.Group className="mb-3" controlId="name">
          <Form.Label>Full Name</Form.Label>
          <div className="input-group">
            <span className="input-group-text">
              <FaUser />
            </span>
            <Form.Control
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </Form.Group>

        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email Address</Form.Label>
          <div className="input-group">
            <span className="input-group-text">
              <FaEnvelope />
            </span>
            <Form.Control
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </Form.Group>

        <Form.Group className="mb-3" controlId="phone">
          <Form.Label>Phone Number</Form.Label>
          <div className="input-group">
            <span className="input-group-text">
              <FaPhone />
            </span>
            <Form.Control
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </Form.Group>

        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Password</Form.Label>
          <div className="input-group">
            <span className="input-group-text">
              <FaLock />
            </span>
            <Form.Control
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Form.Text className="text-muted">
            Password must be at least 6 characters long
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="confirmPassword">
          <Form.Label>Confirm Password</Form.Label>
          <div className="input-group">
            <span className="input-group-text">
              <FaLock />
            </span>
            <Form.Control
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </Form.Group>

        <Form.Group className="mb-4" controlId="role">
          <Form.Label>Register as</Form.Label>
          <div className="input-group">
            <span className="input-group-text">
              <FaBuilding />
            </span>
            <Form.Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">Attendee (find and book events)</option>
              <option value="organizer">Organizer (create and manage events)</option>
            </Form.Select>
          </div>
        </Form.Group>

        <div className="d-grid gap-2">
          <Button variant="primary" type="submit" disabled={loading}>
            Register
          </Button>
        </div>
      </Form>

      <Row className="py-3">
        <Col>
          Already have an account?{' '}
          <Link to="/login" className="text-decoration-none">
            Login here
          </Link>
        </Col>
      </Row>
    </FormContainer>
  );
};

export default RegisterPage;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { login, clearError } from '../redux/slices/authSlice';
import FormContainer from '../components/shared/FormContainer';
import Message from '../components/shared/Message';
import Loader from '../components/shared/Loader';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { loading, error, userInfo } = useSelector((state) => state.auth);

  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    // If already logged in, redirect
    if (userInfo) {
      navigate(redirect);
    }
    
    // Clear errors when component unmounts
    return () => {
      dispatch(clearError());
    };
  }, [userInfo, navigate, redirect, dispatch]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <FormContainer title="Sign In">
      {error && <Message variant="danger">{error}</Message>}
      {loading && <Loader />}
      
      <Form onSubmit={submitHandler}>
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

        <Form.Group className="mb-4" controlId="password">
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
        </Form.Group>

        <div className="d-grid gap-2">
          <Button variant="primary" type="submit" disabled={loading}>
            Sign In
          </Button>
        </div>
      </Form>

      <Row className="py-3">
        <Col>
          New user?{' '}
          <Link
            to={redirect ? `/register?redirect=${redirect}` : '/register'}
            className="text-decoration-none"
          >
            Register here
          </Link>
        </Col>
      </Row>
      
      <Row>
        <Col className="text-center">
          <Link to="/forgot-password" className="text-decoration-none">
            Forgot password?
          </Link>
        </Col>
      </Row>
    </FormContainer>
  );
};

export default LoginPage;

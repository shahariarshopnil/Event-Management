import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = ({ children }) => {
  const { userInfo } = useSelector((state) => state.auth);

  if (!userInfo) {
    // If not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (userInfo.role !== 'admin') {
    // If not an admin, redirect to home page
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;

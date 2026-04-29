import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to their respective dashboard if they try to access something unauthorized
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'staff') return <Navigate to="/staff" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

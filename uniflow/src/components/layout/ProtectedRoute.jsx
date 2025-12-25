import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // 1. If not logged in, kick to Login Page (and remember where they were trying to go)
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If Admin access is required, but user is NOT admin, kick to Home
  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 3. Otherwise, let them in!
  return children;
};

export default ProtectedRoute;
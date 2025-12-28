import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false, superAdminOnly = false }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-[#0f0f10]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  // 1. Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // 👑 SUPER ADMIN BYPASS: If you are the owner, you can access EVERYTHING.
  if (profile?.role === 'super_admin') {
    return children;
  }

  // 🛡️ ADMIN CHECK: If a route requires admin and user is just a student
  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  // ⛔ SUPER ADMIN ONLY: For the Command Center (Standard Admins can't enter)
  if (superAdminOnly && profile?.role !== 'super_admin') {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
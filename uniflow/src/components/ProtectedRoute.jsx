import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false, superAdminOnly = false }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  // 1. Must be logged in
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // 👑 GOD MODE: Super Admin passes EVERY check instantly
  if (profile?.role === 'super_admin') {
    return children;
  }

  // 🛡️ Standard Admin Check
  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  // ⛔ Strict Super Admin Check (Command Center)
  if (superAdminOnly && profile?.role !== 'super_admin') {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
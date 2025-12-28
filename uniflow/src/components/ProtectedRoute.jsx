import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false, superAdminOnly = false }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 animate-pulse">Authenticating...</p>
      </div>
    );
  }
  
  // 1. Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // 👑 GOD MODE: Super Admin passes EVERY single check instantly
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
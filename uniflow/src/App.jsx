import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import Navbar from './components/layout/Navbar';

// Pages
// 👇 THIS WAS THE ERROR. NOW IT WILL WORK BECAUSE WE CREATED THE FILE ABOVE.
import HomePage from './features/home/pages/HomePage'; 
import EventsPage from './features/events/pages/EventsPage';
import EventDetailsPage from './features/events/pages/EventDetailsPage';
import LoginPage from './features/auth/pages/LoginPage';
import MyTicketsPage from './features/tickets/pages/MyTicketsPage';
import TicketPage from './features/tickets/pages/TicketPage'; 

// Admin Pages
import AdminDashboard from './features/admin/pages/AdminDashboard';
import SuperAdminDashboard from './features/super-admin/pages/SuperAdminDashboard';

// 🛡️ Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;

  // Role Check
  if (requiredRole) {
    if (requiredRole === 'admin' && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return <Navigate to="/" />;
    }
    if (requiredRole === 'super_admin' && profile?.role !== 'super_admin') {
      return <Navigate to="/" />;
    }
  }

  return children;
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
            <Navbar />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              
              {/* Event Routes */}
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailsPage />} />

              {/* User Routes (Protected) */}
              <Route path="/my-tickets" element={
                <ProtectedRoute>
                  <MyTicketsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/tickets/:ticketId" element={
                <ProtectedRoute>
                  <TicketPage />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* Super Admin Routes */}
              <Route path="/super-admin" element={
                <ProtectedRoute requiredRole="super_admin">
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
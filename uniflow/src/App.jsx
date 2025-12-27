import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import LoginPage from './features/auth/components/LoginPage';
import SignupPage from './features/auth/components/SignupPage';

// Events & Home
import HomePage from './features/events/components/HomePage'; // 👈 NEW IMPORT
import EventsPage from './features/events/components/EventsPage';
import EventDetailsPage from './features/events/components/EventDetailsPage';
import CreateEventModal from './features/events/components/CreateEventModal';
import MyTicketsPage from './features/events/components/MyTicketsPage';
import TicketPage from './features/events/components/TicketPage'; // The Public Ticket View

// Admin
import AdminDashboard from './features/events/components/AdminDashboard';
import ScannerPage from './features/events/components/ScannerPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black text-zinc-500">Loading...</div>;
  
  if (!user) return <Navigate to="/login" />;
  
  if (adminOnly && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return <Navigate to="/" />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans transition-colors duration-200">
          <Navbar />
          <Routes>
            {/* 🏠 PUBLIC ROUTES */}
            <Route path="/" element={<HomePage />} /> {/* 👈 LANDING PAGE */}
            <Route path="/events" element={<EventsPage />} /> {/* 👈 DISCOVERY PAGE */}
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* 🔒 PROTECTED STUDENT ROUTES */}
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

            {/* 🛡️ ADMIN ROUTES */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/create-event" element={
              <ProtectedRoute adminOnly={true}>
                <CreateEventModal isOpen={true} onClose={() => {}} />
              </ProtectedRoute>
            } />

            <Route path="/scan" element={
              <ProtectedRoute adminOnly={true}>
                <ScannerPage />
              </ProtectedRoute>
            } />

            {/* 404 Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
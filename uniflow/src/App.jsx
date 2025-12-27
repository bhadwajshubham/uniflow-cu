import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import HomePage from './features/events/components/HomePage';
import LoginPage from './features/auth/components/LoginPage';
import HelpPage from './features/events/components/HelpPage';
import EventsPage from './features/events/components/EventsPage';
import EventDetailsPage from './features/events/components/EventDetailsPage';
import MyTicketsPage from './features/events/components/MyTicketsPage';
import TicketPage from './features/events/components/TicketPage'; 
import AdminDashboard from './features/events/components/AdminDashboard';
import ScannerPage from './features/events/components/ScannerPage';
import AboutPage from './features/events/components/AboutPage';

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
          <Navbar />
          <Routes>
            {/* 🏠 PUBLIC ROUTES */}
            <Route path="/" element={<HomePage />} /> {/* 👈 LANDING PAGE */}
            <Route path="/events" element={<EventsPage />} /> {/* 👈 DISCOVERY */}
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/help" element={<HelpPage />} />
            
            {/* 🔒 PROTECTED STUDENT ROUTES */}
            <Route 
              path="/my-tickets" 
              element={
                <ProtectedRoute>
                  <MyTicketsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route path="/about" element={<AboutPage />} />
            
            {/* Premium Ticket View */}
            <Route 
              path="/tickets/:ticketId" 
              element={
                <ProtectedRoute>
                  <TicketPage />
                </ProtectedRoute>
              } 
            />

            {/* 🛡️ PROTECTED ADMIN ROUTES */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/scan" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ScannerPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all - Redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
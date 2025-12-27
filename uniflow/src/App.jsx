import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// ------------------- PAGES -------------------

// 1. Core & Public
import HomePage from './features/events/components/HomePage';
import LoginPage from './features/auth/components/LoginPage';
import HelpPage from './features/events/components/HelpPage';

// ⚠️ FIX: Importing AboutPage from the 'auth' folder as per your file structure
import AboutPage from './features/auth/AboutPage'; 

// 2. Events Discovery
import EventsPage from './features/events/components/EventsPage';
import EventDetailsPage from './features/events/components/EventDetailsPage';

// 3. Student Features
import MyTicketsPage from './features/events/components/MyTicketsPage';
import TicketPage from './features/events/components/TicketPage'; 

// 4. Admin Features
import AdminDashboard from './features/events/components/AdminDashboard';
import ScannerPage from './features/events/components/ScannerPage';


const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
          <Navbar />
          <Routes>
            {/* 🏠 PUBLIC ROUTES */}
            <Route path="/" element={<HomePage />} />            {/* Landing Page */}
            <Route path="/events" element={<EventsPage />} />    {/* Discovery */}
            <Route path="/events/:id" element={<EventDetailsPage />} />
            
            <Route path="/login" element={<LoginPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/about" element={<AboutPage />} />      {/* Fame Page */}
            
            {/* 🔒 PROTECTED STUDENT ROUTES */}
            <Route 
              path="/my-tickets" 
              element={
                <ProtectedRoute>
                  <MyTicketsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Premium Ticket View (Shareable) */}
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
            
            {/* 404 - Redirect everything else to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
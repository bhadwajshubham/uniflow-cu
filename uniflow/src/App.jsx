import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// 🏠 Pages (Using YOUR Original Architecture)
import HomePage from './features/events/components/HomePage';
import LoginPage from './features/auth/components/LoginPage';
import HelpPage from './features/events/components/HelpPage';
import AboutPage from './features/auth/AboutPage';

import EventsPage from './features/events/components/EventsPage';
import EventDetailsPage from './features/events/components/EventDetailsPage';
import MyTicketsPage from './features/events/components/MyTicketsPage';
import TicketPage from './features/events/components/TicketPage'; 

import AdminDashboard from './features/events/components/AdminDashboard';
import ScannerPage from './features/events/components/ScannerPage';
import SuperAdminDashboard from './features/events/components/SuperAdminDashboard'; 

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
          <Navbar />
          <Routes>
            {/* 🏠 PUBLIC ROUTES */}
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/about" element={<AboutPage />} />
            
            {/* 🔒 PROTECTED STUDENT ROUTES */}
            <Route 
              path="/my-tickets" 
              element={
                <ProtectedRoute>
                  <MyTicketsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/tickets/:ticketId" 
              element={
                <ProtectedRoute>
                  <TicketPage />
                </ProtectedRoute>
              } 
            />

            {/* 🛡️ ADMIN ROUTES */}
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

            {/* 👑 SUPER ADMIN ROUTE (GOD MODE) */}
            <Route 
              path="/super-admin" 
              element={
                <ProtectedRoute superAdminOnly={true}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
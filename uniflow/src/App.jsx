import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

import LoginPage from './features/auth/components/LoginPage';
import HelpPage from './features/auth/components/HelpPage'; 

// Events
import EventsPage from './features/events/components/EventsPage';
// 👇 NEW IMPORT
import EventDetailsPage from './features/events/components/EventDetailsPage'; 
import MyTicketsPage from './features/events/components/MyTicketsPage';

// Admin
import AdminDashboard from './features/events/components/AdminDashboard';
import ScanPage from './features/events/components/ScanPage';

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
          <Navbar />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/" element={<EventsPage />} />
            <Route path="/events" element={<EventsPage />} />
            
            {/* 👇 THIS FIXES THE BLUE SCREEN */}
            <Route path="/events/:id" element={<EventDetailsPage />} /> 

            {/* Protected Student */}
            <Route 
              path="/my-tickets" 
              element={
                <ProtectedRoute>
                  <MyTicketsPage />
                </ProtectedRoute>
              } 
            />

            {/* Protected Admin */}
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
                  <ScanPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
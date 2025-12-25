import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { AuthProvider } from './context/AuthContext';
// 👇 IMPORT THE MISSING PROVIDER
import { ThemeProvider } from './context/ThemeContext'; 
import ProtectedRoute from './components/layout/ProtectedRoute';

// 1. Auth Components
import LoginPage from './features/auth/components/LoginPage';

// 2. Event Components
import EventsPage from './features/events/components/EventsPage';
import MyTicketsPage from './features/events/components/MyTicketsPage';
import HelpPage from './features/events/components/HelpPage';
import AdminDashboard from './features/events/components/AdminDashboard';
import ScanPage from './features/events/components/ScanPage';

const App = () => {
  return (
    <AuthProvider>
      {/* 👇 WRAP EVERYTHING IN THEME PROVIDER */}
      <ThemeProvider>
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/" element={<EventsPage />} />
            <Route path="/events" element={<EventsPage />} />
            
            {/* Protected Student Routes */}
            <Route 
              path="/my-tickets" 
              element={
                <ProtectedRoute>
                  <MyTicketsPage />
                </ProtectedRoute>
              } 
            />

            {/* Protected Admin Routes */}
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
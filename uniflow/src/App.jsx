import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// 1. Auth Components
import LoginPage from './features/auth/components/LoginPage';
import HelpPage from './features/auth/components/HelpPage'; // We moved this here

// 2. Feature Components
import EventsPage from './features/events/components/EventsPage';
import MyTicketsPage from './features/tickets/components/MyTicketsPage';
import AdminDashboard from './features/admin/components/AdminDashboard';
import ScannerPage from './features/admin/components/ScannerPage'; // Ensure you have this or comment it out if not

const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-200">
        <Navbar />
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/" element={<EventsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventsPage />} /> {/* Placeholder for details */}

            {/* Protected Routes (Students) */}
            <Route 
              path="/my-tickets" 
              element={
                <ProtectedRoute>
                  <MyTicketsPage />
                </ProtectedRoute>
              } 
            />

            {/* Protected Routes (Admins) */}
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
                  {/* If you haven't created ScannerPage yet, this might error. 
                      If so, replace <ScannerPage /> with <div>Scanner Coming Soon</div> */}
                  <ScannerPage /> 
                </ProtectedRoute>
              } 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
};

export default App;
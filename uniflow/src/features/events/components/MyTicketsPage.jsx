import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// 1. Auth Components
import LoginPage from './features/auth/components/LoginPage';
import HelpPage from './features/auth/components/HelpPage'; // We fixed this earlier

// 2. Event/Ticket Components (ALL IN EVENTS FOLDER NOW)
import EventsPage from './features/events/components/EventsPage';
// 👇 FIX: Importing MyTickets from events folder to avoid "missing folder" error
import MyTicketsPage from './features/events/components/MyTicketsPage'; 

// 3. Admin Components
import AdminDashboard from './features/admin/components/AdminDashboard';
import ScanPage from './features/admin/components/ScanPage'; // Ensure you have this or comment it out if not

const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/" element={<EventsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventsPage />} /> {/* Placeholder for details */}

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
    </AuthProvider>
  );
};

export default App;
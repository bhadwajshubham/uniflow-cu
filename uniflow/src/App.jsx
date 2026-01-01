import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// ✅ Navbar Import (Your Custom UI)
import Navbar from './components/layout/Navbar';

// ✅ Pages Imports
import HomePage from './features/events/components/HomePage';
import EventsPage from './features/events/components/EventsPage';
import LoginPage from './features/auth/components/LoginPage';
// import RegisterPage from './pages/RegisterPage'; 
import MyTicketsPage from './features/events/components/MyTicketsPage';
import UserProfile from './features/auth/components/UserProfile';

// ✅ Feature Components
import EventDetailsPage from './features/events/components/EventDetailsPage';
import TicketPage from './features/events/components/TicketPage';

// ✅ Admin Components
import AdminDashboard from './features/events/components/AdminDashboard';
// import CreateEventPage from './features/events/components/CreateEventPage'; 
import ScannerPage from './features/events/components/ScannerPage';

// 🛡️ Protected Route Wrapper
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return null; 

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    // ✨ Context Provider
    <AuthProvider>
      {/* LAYOUT CONTAINER:
         - min-h-screen: Ensures app takes full mobile height
         - flex flex-col: Stacks Navbar and Main content vertically
         - bg-zinc-50/dark:bg-black: Preserves your theme
      */}
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col">
        
        {/* Navigation Bar 
           (Includes your Desktop TopBar and Mobile BottomBar if handled inside Navbar) 
        */}
        <Navbar />
        
        {/* Main Content Area - Grows to fill space between bars */}
        <main className="flex-grow">
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            {/* <Route path="/register" element={<RegisterPage />} /> */}

            {/* --- Student Routes --- */}
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/my-tickets" element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} />
            <Route path="/tickets/:ticketId" element={<ProtectedRoute><TicketPage /></ProtectedRoute>} />

            {/* --- Admin Routes --- */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            {/* <Route path="/admin/create" element={<ProtectedRoute requireAdmin><CreateEventPage /></ProtectedRoute>} /> */}
            <Route path="/scan" element={<ProtectedRoute requireAdmin><ScannerPage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
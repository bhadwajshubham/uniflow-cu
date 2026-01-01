import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// ✅ Components (Ensure Navbar exists in src/components/)
import Navbar from './components/Navbar';

// ✅ Pages
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

// ✅ Feature Components
import EventDetailsPage from './features/events/components/EventDetailsPage';
import TicketPage from './features/events/components/TicketPage';
import MyTickets from './features/events/components/MyTickets';

// ✅ Admin Components
import AdminDashboard from './features/events/components/AdminDashboard';
import CreateEventPage from './features/events/components/CreateEventPage';
import ScannerPage from './features/events/components/ScannerPage';
import EditEventModal from './features/events/components/EditEventModal'; // Only used inside Dashboard, but good to have reference

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
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col">
          {/* Navbar on top */}
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              {/* --- Public Routes --- */}
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* --- Student Routes (Protected) --- */}
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
              <Route path="/tickets/:ticketId" element={<ProtectedRoute><TicketPage /></ProtectedRoute>} />

              {/* --- Admin Routes (Protected + Role Check) --- */}
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/create" element={<ProtectedRoute requireAdmin><CreateEventPage /></ProtectedRoute>} />
              <Route path="/scan" element={<ProtectedRoute requireAdmin><ScannerPage /></ProtectedRoute>} />

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          
          {/* ❌ Removed Footer as per your instruction */}
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
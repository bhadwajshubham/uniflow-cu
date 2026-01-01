import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// ✅ Navbar Import
import Navbar from './components/layout/Navbar';

// ✅ Pages Imports - Corrected Paths based on your file structure
import HomePage from './features/events/components/HomePage';
import EventsPage from './features/events/components/EventsPage';
import LoginPage from './features/auth/components/LoginPage';
// RegisterPage seems missing in your file list for src/features/auth/components, 
// checking src/features/events/components shows RegisterModal.jsx but no RegisterPage.jsx.
// Assuming you might be using RegisterModal or need to create RegisterPage.
// For now, I will comment it out or you need to verify where RegisterPage is.
// import RegisterPage from './pages/RegisterPage'; 
import MyTicketsPage from './features/events/components/MyTicketsPage'; // Renamed from MyTickets based on your file list
import UserProfile from './features/auth/components/UserProfile'; // Assuming this is the ProfilePage

// ✅ Feature Components
import EventDetailsPage from './features/events/components/EventDetailsPage';
import TicketPage from './features/events/components/TicketPage';

// ✅ Admin Components
import AdminDashboard from './features/events/components/AdminDashboard';
// CreateEventPage is missing, but CreateEventModal exists. 
// If CreateEventPage is indeed a page, please create it or point to the modal wrapper.
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
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col">
          {/* Navbar */}
          <Navbar />
          
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
    </Router>
  );
}

export default App;
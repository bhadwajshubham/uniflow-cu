import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// ✅ Navbar
import Navbar from './components/layout/Navbar';

// ✅ Pages
import HomePage from './features/events/components/HomePage';
import EventsPage from './features/events/components/EventsPage';
import LoginPage from './features/auth/components/LoginPage';
import MyTicketsPage from './features/events/components/MyTicketsPage';
import EventDetailsPage from './features/events/components/EventDetailsPage';
import TicketPage from './features/events/components/TicketPage';

// ✅ User
import UserProfile from './features/auth/components/UserProfile';

// ✅ Admin & Super Admin Components
import AdminDashboard from './features/events/components/AdminDashboard';
import ScannerPage from './features/events/components/ScannerPage';
import CreateEventModal from './features/events/components/CreateEventModal';
import SuperAdminDashboard from './features/events/components/SuperAdminDashboard'; // 👈 IMPORT THIS

// ✅ Trust Pages
import AboutPage from './pages/AboutPage';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

/* =========================
   🔐 SMART PROTECTED ROUTE
   ========================= */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // 1. Login Check
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role Check
  if (allowedRoles.length > 0 && profile) {
    if (!allowedRoles.includes(profile.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

/* =========================
   🧩 MODAL WRAPPER
   ========================= */
const ModalRouteWrapper = ({ Component, backPath = '/' }) => {
  const navigate = useNavigate();
  if (!Component) return null;
  return <Component isOpen={true} onClose={() => navigate(backPath)} />;
};

/* =========================
   🚀 APP COMPONENT
   ========================= */
function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col relative pb-24 md:pb-0 transition-colors duration-300">
        
        {/* Navbar */}
        <Navbar />

        <main className="flex-grow">
          <Routes>

            {/* 🌐 PUBLIC ROUTES */}
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* 👤 USER ROUTES */}
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/my-tickets" element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} />
            <Route path="/tickets/:ticketId" element={<ProtectedRoute><TicketPage /></ProtectedRoute>} />

            {/* 🔥 SUPER ADMIN "ROOT" ROUTE (New Dashboard) */}
            <Route
              path="/root"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 🛠️ REGULAR ADMIN ROUTE (Event Management) */}
            {/* Super Admin can also access this to create events */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/create"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <ModalRouteWrapper Component={CreateEventModal} backPath="/admin" />
                </ProtectedRoute>
              }
            />

            {/* 📷 SCANNER ROUTE */}
            <Route
              path="/scan"
              element={
                <ProtectedRoute allowedRoles={['scanner', 'admin', 'super_admin']}>
                  <ScannerPage />
                </ProtectedRoute>
              }
            />

            {/* 🔚 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
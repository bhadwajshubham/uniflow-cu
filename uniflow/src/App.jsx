import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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

// ✅ Admin
import AdminDashboard from './features/events/components/AdminDashboard';
import ScannerPage from './features/events/components/ScannerPage';
import CreateEventModal from './features/events/components/CreateEventModal';

// ✅ Trust Pages
import AboutPage from './pages/AboutPage';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

/* =========================
   🔐 PROTECTED ROUTE (FIXED)
   ========================= */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // ❌ Not logged in -> Login Page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Consent not accepted -> Redirect to PROFILE (Not Consent Page)
  // Kyunki Profile page pe hi humara Shield wala UI hai ab.
  if (!profile || profile.termsAccepted !== true) {
    // Agar banda already profile page access kar raha hai, toh loop mat karo
    if (window.location.pathname !== '/profile') {
        return <Navigate to="/profile" replace />;
    }
  }

  // ❌ Admin check
  if (requireAdmin && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  // ✅ Allowed
  return children;
};

/* =========================
   🧩 MODAL WRAPPER
   ========================= */
const ModalRouteWrapper = ({ Component, backPath = '/' }) => {
  const navigate = useNavigate();
  // Simple check to ensure we don't render if component is missing
  if (!Component) return null;
  return <Component isOpen={true} onClose={() => navigate(backPath)} />;
};

/* =========================
   🚀 APP
   ========================= */
function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col relative pb-24 md:pb-0 transition-colors duration-300">
        
        {/* Navbar */}
        <Navbar />

        <main className="flex-grow">
          <Routes>

            {/* 🌐 Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            

            {/* 👤 User */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  {/* Note: UserProfile is not a modal in your implementation, it's a page component */}
                  {/* If UserProfile expects isOpen/onClose props, keep ModalRouteWrapper. */}
                  {/* If UserProfile is a standard page, just use <UserProfile /> */}
                  {/* Assuming standard page based on previous code: */}
                  <UserProfile /> 
                </ProtectedRoute>
              }
            />

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

            {/* 🛠️ Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/create"
              element={
                <ProtectedRoute requireAdmin>
                  <ModalRouteWrapper Component={CreateEventModal} backPath="/admin" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/scan"
              element={
                <ProtectedRoute requireAdmin>
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
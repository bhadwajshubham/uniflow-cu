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

// ✅ Admin
import AdminDashboard from './features/events/components/AdminDashboard';
import ScannerPage from './features/events/components/ScannerPage';
import CreateEventModal from './features/events/components/CreateEventModal';

// ✅ Trust Pages
import AboutPage from './pages/AboutPage';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

/* =========================
   🔐 PROTECTED ROUTE (FIXED LOGIC)
   ========================= */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // 1. Not Logged In -> Go to Login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Admin Check
  if (requireAdmin && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  // 3. (Optional) Force Profile Completion
  // Note: We generally don't block access to the *whole* app based on profile 
  // completeness because it can cause loops. Instead, we block specific actions 
  // (like booking a ticket) inside the components themselves.
  // However, if you MUST block navigation, ensure you don't block the /profile route itself.
  
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

            {/* 🌐 PUBLIC ROUTES (Accessible by everyone) */}
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Trust Pages (Must be public to avoid loops) */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* 👤 USER ROUTES (Protected) */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  {/* UserProfile handles its own "editing" state */}
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

            {/* 🛠️ ADMIN ROUTES (Protected + Admin Role) */}
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

            {/* 🔚 Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
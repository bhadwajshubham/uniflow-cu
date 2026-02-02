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
   🔐 SMART PROTECTED ROUTE (Role Based)
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

  // 2. Role Check logic
  // Agar 'allowedRoles' array pass kiya hai, toh check karo ki user ka role usme hai ya nahi
  if (allowedRoles.length > 0 && profile) {
    if (!allowedRoles.includes(profile.role)) {
      // Agar role match nahi hua (e.g. Scanner banda Admin khol raha hai), toh Home bhej do
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

            {/* 🌐 PUBLIC ROUTES (Accessible by everyone) */}
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Trust Pages (Loop Fix: Inhe Public rehne do) */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* 👤 USER ROUTES (Protected for Logged In Users) */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
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

            {/* 🛠️ ADMIN ROUTES (Sirf Admin & Super Admin) */}
            {/* Note: Scanner role yahan nahi aa sakta */}
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

            {/* 📷 SCANNER ROUTE (Scanner + Admin + Super Admin) */}
            {/* Note: Yahan scanner allow kiya hai */}
            <Route
              path="/scan"
              element={
                <ProtectedRoute allowedRoles={['scanner', 'admin', 'super_admin']}>
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
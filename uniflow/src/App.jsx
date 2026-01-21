import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// ✅ Navbar Import (Your App-Like Navbar)
import Navbar from './components/layout/Navbar';

// ✅ Pages Imports
import HomePage from './features/events/components/HomePage';
import EventsPage from './features/events/components/EventsPage';
import LoginPage from './features/auth/components/LoginPage';
import MyTicketsPage from './features/events/components/MyTicketsPage';

// ✅ The Feature Components you asked to keep active
import UserProfile from './features/auth/components/UserProfile';
import CreateEventModal from './features/events/components/CreateEventModal'; // Assuming file name is CreateEventModal.jsx

// ✅ Feature Details
import EventDetailsPage from './features/events/components/EventDetailsPage';
import TicketPage from './features/events/components/TicketPage';

// ✅ Admin Components
import AdminDashboard from './features/events/components/AdminDashboard';
import ScannerPage from './features/events/components/ScannerPage';

// ✅ Public Trust Pages
import About from './pages/AboutPage';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AboutPage from './pages/AboutPage';


// 🛡️ Protected Route Wrapper
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return <Navigate to="/" />;
  }

  return children;
};

// 🛠️ Helper to make Modals act like Pages
const ModalRouteWrapper = ({ Component, backPath = '/' }) => {
  const navigate = useNavigate();
  // We pass isOpen={true} so it renders immediately
  // We pass onClose so the 'X' button goes back to the previous page
  return <Component isOpen={true} onClose={() => navigate(backPath)} />;
};

function App() {
  return (
    <AuthProvider>
      {/* LAYOUT CONTAINER:
          - pb-24: Ensures content isn't hidden behind the Mobile Bottom Bar 
      */}
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col relative pb-24 md:pb-0 transition-colors duration-300">
        
        {/* Navbar (Top & Bottom) */}
        <Navbar />
        
        <main className="flex-grow">
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />


            {/* --- Student Routes --- */}
            {/* UserProfile is now a route. We wrap it to handle the 'isOpen' prop */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <ModalRouteWrapper Component={UserProfile} backPath="/" />
              </ProtectedRoute>
            } />
            
            <Route path="/my-tickets" element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} />
            <Route path="/tickets/:ticketId" element={<ProtectedRoute><TicketPage /></ProtectedRoute>} />

            {/* --- Admin Routes --- */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            
            {/* ✅ Create Event Page Active Here */}
            <Route path="/admin/create" element={
              <ProtectedRoute requireAdmin>
                <ModalRouteWrapper Component={CreateEventModal} backPath="/admin" />
              </ProtectedRoute>
            } />
            
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
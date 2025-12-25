import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext'; // <--- NEW IMPORT

// Feature Components
import LoginPage from './features/auth/components/LoginPage';
import EventsPage from './features/events/components/EventsPage';
import MyTicketsPage from './features/events/components/MyTicketsPage';
import ScannerPage from './features/events/components/ScannerPage';
import UserProfile from './features/auth/components/UserProfile';
import LeaderboardPage from './features/events/components/LeaderboardPage';
import AdminDashboard from './features/events/components/AdminDashboard';
import VerificationPage from './features/events/components/VerificationPage';
import AboutPage from './features/auth/AboutPage'; // <--- NEW IMPORT

// Core Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    // 1. Theme Provider wraps everything so Dark Mode works everywhere
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* ────────── PUBLIC ROUTES ────────── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify" element={<VerificationPage />} />
            
            {/* ────────── PROTECTED ROUTES ────────── */}
            {/* The Layout component wraps all these pages */}
            <Route element={<Layout />}>
              
              <Route path="/events" element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              } />

              <Route path="/tickets" element={
                <ProtectedRoute>
                  <MyTicketsPage />
                </ProtectedRoute>
              } />

              <Route path="/leaderboard" element={
                <ProtectedRoute>
                  <LeaderboardPage />
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />

              {/* NEW: About / Founders Page */}
              <Route path="/about" element={
                <ProtectedRoute>
                  <AboutPage />
                </ProtectedRoute>
              } />

              {/* ADMIN ONLY ROUTES */}
              <Route path="/scan" element={
                <ProtectedRoute requireAdmin={true}>
                  <ScannerPage />
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

            </Route>
            
            {/* ────────── DEFAULT REDIRECT ────────── */}
            <Route path="/" element={<Navigate to="/events" replace />} />

          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
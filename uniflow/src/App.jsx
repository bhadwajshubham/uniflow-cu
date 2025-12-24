import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import LoginPage from './features/auth/components/LoginPage';
import EventsPage from './features/events/components/EventsPage';
import MyTicketsPage from './features/events/components/MyTicketsPage';
import ScannerPage from './features/events/components/ScannerPage';
import UserProfile from './features/auth/components/UserProfile';
import LeaderboardPage from './features/events/components/LeaderboardPage';
import AdminDashboard from './features/events/components/AdminDashboard';
import VerificationPage from './features/events/components/VerificationPage'; // <--- Import
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify" element={<VerificationPage />} /> {/* <--- Public Access */}
          
          {/* PROTECTED ROUTES */}
          <Route element={<Layout />}>
            <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/scan" element={<ProtectedRoute requireAdmin={true}><ScannerPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
          </Route>
          
          <Route path="/" element={<Navigate to="/events" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
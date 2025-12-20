import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './features/auth/components/LoginPage';
import EventsPage from './features/events/components/EventsPage';
import MyTicketsPage from './features/events/components/MyTicketsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Main App Routes */}
          <Route path="/events" element={<EventsPage />} />
          <Route path="/tickets" element={<MyTicketsPage />} />
          
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/events" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
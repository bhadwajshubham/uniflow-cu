import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { currentUser, userRole, loading } = useAuth();

  // 1. Wait for Auth to check status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // 2. Not Logged In? -> Go to Login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 3. Admin Route but User is NOT Admin? -> Go to Events
  if (requireAdmin && userRole !== 'admin') {
    return <Navigate to="/events" replace />;
  }

  // 4. Access Granted
  return children;
};

export default ProtectedRoute;
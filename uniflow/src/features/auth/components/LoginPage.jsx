import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Ensure path is correct
import { LogIn } from 'lucide-react';

const LoginPage = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. THE EJECTOR SEAT: If user exists, go to Home immediately
  useEffect(() => {
    if (user) {
      // If they tried to go somewhere else before logging in, send them there. 
      // Otherwise, go to home.
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    }
  }, [user, navigate, location]);

  const handleGoogleLogin = async () => {
    try {
      await login();
      // The useEffect above will handle the redirect once 'user' updates
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800">
        
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
            <LogIn className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Welcome Back</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Sign in to access your tickets and events</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-5 h-5"
          />
          Continue with Google
        </button>

        <p className="mt-8 text-center text-xs text-zinc-400">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
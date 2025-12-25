import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// 👇 This path is now CORRECT (3 levels up)
import { useAuth } from '../../../context/AuthContext'; 
import { LogIn } from 'lucide-react';

const LoginPage = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. THE EJECTOR SEAT (Redirect Logic) 💺
  useEffect(() => {
    // If user is logged in...
    if (user) {
      console.log("🚀 User detected on Login Page. Ejecting to Dashboard...");
      
      // Check if they were trying to go somewhere specific, otherwise go Home
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    }
  }, [user, navigate, location]);

  const handleGoogleLogin = async () => {
    try {
      console.log("🖱️ Google Login Clicked...");
      await login();
      console.log("✅ Login Function Finished. Waiting for Redirect...");
    } catch (error) {
      console.error("❌ Login failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  // Show spinner while checking auth state
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
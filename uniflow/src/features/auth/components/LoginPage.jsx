import { useAuth } from '../../../context/AuthContext'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowRight, Calendar, QrCode, Trophy, Lock } from 'lucide-react';

const LoginPage = () => {
  const { login, user, loading } = useAuth(); 
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  // 🔄 1. AUTO-REDIRECT LOGIC (SECURED)
  useEffect(() => {
    if (user && !loading) {
      console.log("✅ User detected. Redirecting to Dashboard...");
      
      // 🛡️ SECURITY FIX: Prevent Open Redirect Vulnerability
      // Hackers can use 'state.from' to redirect users to phishing sites.
      // We force the destination to be an internal path (starts with / and not //)
      
      let destination = location.state?.from?.pathname || '/events';
      
      // If destination looks suspicious (e.g., "http://evil.com" or "//evil.com"), reset it.
      if (!destination.startsWith('/') || destination.startsWith('//')) {
         console.warn("Blocked potential open redirect attempt.");
         destination = '/events';
      }

      navigate(destination, { replace: true });
    }
  }, [user, loading, navigate, location]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await login();
      // The useEffect above handles the redirect
    } catch (error) {
      console.error('Login Failed', error);
      setError('Authentication failed. Please try again.');
    }
  };

  // 🛑 2. PREVENT FLICKER
  if (loading || user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-zinc-500 text-sm font-medium animate-pulse">
          {user ? "Redirecting to Dashboard..." : "Loading UniFlow..."}
        </p>
      </div>
    );
  }

  // 🎨 3. RENDER LOGIN FORM
  return (
    <div className="min-h-screen flex bg-white dark:bg-zinc-950 font-sans">
      
      {/* LEFT SIDE: Dashboard Preview */}
      <div className="hidden lg:flex w-1/2 bg-zinc-50 dark:bg-zinc-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"></div>
        
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8">
             <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
               Campus Event <br/>
               <span className="text-indigo-600 dark:text-indigo-400">Operating System.</span>
             </h1>
             <p className="text-lg text-zinc-500 dark:text-zinc-400">
               Manage registrations, issue tickets, and track attendance in real-time.
             </p>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 backdrop-blur-sm">
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-white">Centralized Schedule</div>
                  <div className="text-xs text-zinc-500">One hub for all university activities</div>
                </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      </div>

      {/* RIGHT SIDE: Login Portal */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black mb-6">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">UniFlow Portal</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Please sign in with your University ID.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="relative w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-900 dark:hover:border-zinc-600 hover:shadow-lg transition-all group"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
              <span className="font-semibold text-zinc-900 dark:text-white">Continue with Google</span>
              <ArrowRight className="absolute right-4 h-4 w-4 text-zinc-300 group-hover:text-zinc-600 dark:group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" />
            </button>
            
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </div>

          <div className="mt-12 flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-zinc-400">
            <Lock className="h-3 w-3" />
            <span>Secure SSL Connection</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
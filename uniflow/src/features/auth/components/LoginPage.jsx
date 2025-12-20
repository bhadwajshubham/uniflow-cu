import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowRight, Calendar, QrCode, Trophy, Shield, Lock } from 'lucide-react';

const LoginPage = () => {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      navigate('/events');
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await login();
      navigate('/events');
    } catch (error) {
      console.error('Login Failed', error);
      setError('Authentication failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-zinc-950 font-sans">
      
      {/* LEFT SIDE: The Functional Dashboard Preview */}
      <div className="hidden lg:flex w-1/2 bg-zinc-50 dark:bg-zinc-900 relative overflow-hidden items-center justify-center p-12">
        {/* Subtle Background Elements */}
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

          {/* Feature Grid (Honest Features Only) */}
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
            
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 backdrop-blur-sm">
                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-white">QR Entry System</div>
                  <div className="text-xs text-zinc-500">Fast, paperless check-ins</div>
                </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 backdrop-blur-sm">
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-white">Smart Certificates</div>
                  <div className="text-xs text-zinc-500">Auto-generated upon participation</div>
                </div>
            </div>
          </div>
        </div>
        
        {/* Technical Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      </div>

      {/* RIGHT SIDE: The Access Portal */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-sm">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black mb-6">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">UniFlow Portal</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Please sign in with your University ID.
            </p>
          </div>

          <div className="space-y-4">
            {/* GOOGLE - Primary Action */}
            <button
              onClick={handleGoogleLogin}
              className="relative w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-900 dark:hover:border-zinc-600 hover:shadow-lg transition-all group"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
              <span className="font-semibold text-zinc-900 dark:text-white">Continue with Google</span>
              <ArrowRight className="absolute right-4 h-4 w-4 text-zinc-300 group-hover:text-zinc-600 dark:group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" />
            </button>

            {/* Other Options (Visual Only - Disabled) */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-400">Or sign in with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button disabled className="flex items-center justify-center py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg opacity-50 cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Microsoft</span>
              </button>
              <button disabled className="flex items-center justify-center py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg opacity-50 cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                 <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Email</span>
              </button>
            </div>
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
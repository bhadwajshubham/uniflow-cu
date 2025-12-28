import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  LogOut, User, Menu, X, Sun, Moon, 
  Shield, Zap, Calendar, Ticket, Home, ScanLine, Settings 
} from 'lucide-react';
import UserProfile from '../../features/auth/components/UserProfile';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const isActive = (path) => location.pathname === path;
  
  // 🛡️ CRITICAL CHECK: Show Admin tools to both roles
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  return (
    <>
      {/* 🖥️ DESKTOP NAVIGATION */}
      <nav className="hidden lg:flex fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 h-20 items-center justify-between px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">U</div>
          <span className="text-2xl font-black tracking-tighter">UniFlow.</span>
        </Link>

        <div className="flex items-center gap-8">
          <Link to="/" className={`text-sm font-bold ${isActive('/') ? 'text-indigo-600' : 'text-zinc-500'}`}>Home</Link>
          <Link to="/events" className={`text-sm font-bold ${isActive('/events') ? 'text-indigo-600' : 'text-zinc-500'}`}>Events</Link>
          <Link to="/my-tickets" className={`text-sm font-bold ${isActive('/my-tickets') ? 'text-indigo-600' : 'text-zinc-500'}`}>My Tickets</Link>
          
          {/* 🔥 VISIBILITY FIX: Show Organizer Link */}
          {isAdmin && (
            <Link to="/admin" className={`text-sm font-black flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${isActive('/admin') ? 'bg-indigo-600 text-white' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'}`}>
              <Shield className="w-4 h-4" /> Organizer Console
            </Link>
          )}

          {profile?.role === 'super_admin' && (
            <Link to="/super-admin" className="text-xs font-black text-red-600 px-3 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg animate-pulse">
              SuperAdmin Panel
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {user ? (
            <button onClick={() => setIsProfileOpen(true)} className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold border-2 border-white shadow-md uppercase">
              {user.displayName?.[0] || 'U'}
            </button>
          ) : (
            <Link to="/login" className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm">Login</Link>
          )}
        </div>
      </nav>

      {/* 📱 MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 z-[100] pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-indigo-600' : 'text-zinc-400'}`}>
            <Home className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Home</span>
          </Link>
          <Link to="/events" className={`flex flex-col items-center gap-1 ${isActive('/events') ? 'text-indigo-600' : 'text-zinc-400'}`}>
            <Calendar className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Events</span>
          </Link>
          <Link to="/my-tickets" className={`flex flex-col items-center gap-1 ${isActive('/my-tickets') ? 'text-indigo-600' : 'text-zinc-400'}`}>
            <Ticket className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Tickets</span>
          </Link>
          
          {/* 🔥 VISIBILITY FIX: Show Admin Tools on Mobile */}
          {isAdmin && (
            <Link to="/admin" className={`flex flex-col items-center gap-1 ${isActive('/admin') ? 'text-indigo-600' : 'text-zinc-400'}`}>
              <Shield className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Admin</span>
            </Link>
          )}

          <button onClick={() => setIsProfileOpen(true)} className="flex flex-col items-center gap-1 text-zinc-400">
            <User className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Profile</span>
          </button>
        </div>
      </nav>

      <UserProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

export default Navbar;
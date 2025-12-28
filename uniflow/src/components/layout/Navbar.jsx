import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  LogOut, User, Menu, X, Sun, Moon, 
  Shield, Zap, Calendar, Ticket, Home, LayoutDashboard 
} from 'lucide-react';
import UserProfile from '../../features/auth/components/UserProfile';

const Navbar = () => {
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  
  // 🛡️ ACCESS CHECK
  const canAccessConsole = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isSuper = profile?.role === 'super_admin';

  return (
    <>
      {/* 🖥️ DESKTOP NAVIGATION */}
      <nav className="hidden lg:flex fixed top-0 w-full z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 h-20 items-center justify-between px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20 italic">U</div>
          <span className="text-2xl font-black tracking-tighter dark:text-white uppercase italic">UniFlow.</span>
        </Link>

        <div className="flex items-center gap-8">
          <Link to="/" className={`text-xs font-black uppercase tracking-widest ${isActive('/') ? 'text-indigo-600' : 'text-zinc-500 hover:text-indigo-500'}`}>Home</Link>
          <Link to="/events" className={`text-xs font-black uppercase tracking-widest ${isActive('/events') ? 'text-indigo-600' : 'text-zinc-500 hover:text-indigo-500'}`}>Events</Link>
          <Link to="/my-tickets" className={`text-xs font-black uppercase tracking-widest ${isActive('/my-tickets') ? 'text-indigo-600' : 'text-zinc-500 hover:text-indigo-500'}`}>Tickets</Link>
          
          {/* 🔥 ADMIN CONSOLE LINK */}
          {canAccessConsole && (
            <Link to="/admin" className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isActive('/admin') ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-100'}`}>
              <LayoutDashboard className="w-4 h-4" /> Organizer Console
            </Link>
          )}

          {isSuper && (
            <Link to="/super-admin" className="text-[10px] font-black text-red-600 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-2xl uppercase tracking-widest border border-red-100 dark:border-red-900/30 animate-pulse">
              Root Console
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-indigo-600 transition-all">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {user ? (
            <button onClick={() => setIsProfileOpen(true)} className="w-11 h-11 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black font-black border-4 border-white dark:border-zinc-800 shadow-xl uppercase transition-transform active:scale-90">
              {user.displayName?.[0] || 'U'}
            </button>
          ) : (
            <Link to="/login" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20">Login</Link>
          )}
        </div>
      </nav>

      {/* 📱 MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-200 dark:border-zinc-800 z-[100] pb-safe">
        <div className="flex justify-around items-center h-20 px-2">
          <Link to="/" className={`flex flex-col items-center gap-1.5 transition-all ${isActive('/') ? 'text-indigo-600 scale-110' : 'text-zinc-400'}`}>
            <Home className="w-6 h-6" /><span className="text-[8px] font-black uppercase tracking-tighter">Home</span>
          </Link>
          
          <Link to="/events" className={`flex flex-col items-center gap-1.5 transition-all ${isActive('/events') ? 'text-indigo-600 scale-110' : 'text-zinc-400'}`}>
            <Calendar className="w-6 h-6" /><span className="text-[8px] font-black uppercase tracking-tighter">Events</span>
          </Link>
          
          {/* 🔥 MOBILE CONSOLE LINK */}
          {canAccessConsole && (
            <Link to="/admin" className={`flex flex-col items-center gap-1.5 transition-all ${isActive('/admin') ? 'text-indigo-600 scale-110' : 'text-zinc-400'}`}>
              <Shield className="w-6 h-6" /><span className="text-[8px] font-black uppercase tracking-tighter">Console</span>
            </Link>
          )}

          <Link to="/my-tickets" className={`flex flex-col items-center gap-1.5 transition-all ${isActive('/my-tickets') ? 'text-indigo-600 scale-110' : 'text-zinc-400'}`}>
            <Ticket className="w-6 h-6" /><span className="text-[8px] font-black uppercase tracking-tighter">Tickets</span>
          </Link>

          <button onClick={() => setIsProfileOpen(true)} className="flex flex-col items-center gap-1.5 text-zinc-400 active:scale-90 transition-transform">
            <div className="w-7 h-7 rounded-full bg-zinc-800 dark:bg-white flex items-center justify-center text-[10px] font-black text-white dark:text-black uppercase">
               {user?.displayName?.[0] || 'U'}
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter">Profile</span>
          </button>
        </div>
      </nav>

      <UserProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

export default Navbar;
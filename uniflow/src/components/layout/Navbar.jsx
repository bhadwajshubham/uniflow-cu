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
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  // 🧭 Navigation Items Configuration
  const navItems = [
    { name: 'Home', path: '/', icon: <Home className="w-6 h-6" /> },
    { name: 'Events', path: '/events', icon: <Calendar className="w-6 h-6" /> },
    { name: 'Tickets', path: '/my-tickets', icon: <Ticket className="w-6 h-6" /> },
    ...(isAdmin ? [{ name: 'Scan', path: '/scan', icon: <ScanLine className="w-6 h-6" /> }] : []),
    { name: 'About', path: '/about', icon: <Settings className="w-6 h-6" /> }
  ];

  return (
    <>
      {/* 🖥️ DESKTOP TOP BAR */}
      <nav className="hidden lg:flex fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 h-20 items-center justify-between px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">U</div>
          <span className="text-2xl font-black tracking-tighter">UniFlow.</span>
        </Link>

        <div className="flex items-center gap-8">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.path} 
              className={`text-sm font-bold transition-colors ${isActive(item.path) ? 'text-indigo-600' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              {item.name}
            </Link>
          ))}
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
            <button onClick={() => setIsProfileOpen(true)} className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold border-2 border-white shadow-md">
              {user.displayName?.[0] || 'U'}
            </button>
          ) : (
            <Link to="/login" className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm">Login</Link>
          )}
        </div>
      </nav>

      {/* 📱 MOBILE BOTTOM NAVIGATION (RESTORED & IMPROVED) */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 z-[100] pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.path} 
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
                isActive(item.path) ? 'text-indigo-600' : 'text-zinc-400'
              }`}
            >
              <div className={`${isActive(item.path) ? 'scale-110' : 'scale-100'}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.name}</span>
              {isActive(item.path) && <div className="absolute bottom-1 w-1 h-1 bg-indigo-600 rounded-full"></div>}
            </Link>
          ))}
          {/* Mobile Profile Toggle */}
          <button 
            onClick={() => user ? setIsProfileOpen(true) : navigate('/login')}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-zinc-400"
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{user ? 'Profile' : 'Login'}</span>
          </button>
        </div>
      </nav>

      {/* 📱 MOBILE TOP BAR (Logo Only) */}
      <div className="lg:hidden fixed top-0 w-full bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-[90] px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-black tracking-tighter">UniFlow.</Link>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme}>{theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
          {profile?.role === 'super_admin' && (
            <Link to="/super-admin" className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg">
              <Zap className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      <UserProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

export default Navbar;
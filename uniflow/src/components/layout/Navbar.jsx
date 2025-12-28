import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  LogOut, User, Menu, X, Sun, Moon, 
  Shield, Zap, Calendar, Ticket, Home, HelpCircle 
} from 'lucide-react';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-black/70 backdrop-blur-2xl border-b border-zinc-200/50 dark:border-zinc-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              U
            </div>
            <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">UniFlow.</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link to="/events" className={`text-sm font-bold ${isActive('/events') ? 'text-indigo-600' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>Explore</Link>
            
            {user && (
              <Link to="/my-tickets" className={`text-sm font-bold ${isActive('/my-tickets') ? 'text-indigo-600' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>My Tickets</Link>
            )}

            {/* Admin Console (Visible to Admin & Super Admin) */}
            {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
              <Link to="/admin" className="text-sm font-black text-indigo-600 flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <Shield className="w-4 h-4" /> Organizer
              </Link>
            )}

            {/* God Mode (Super Admin Only) */}
            {profile?.role === 'super_admin' && (
              <Link to="/super-admin" className="text-sm font-black text-red-600 flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl animate-pulse">
                <Zap className="w-4 h-4" /> God Mode
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:scale-110 transition-all">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="hidden lg:flex items-center gap-4 border-l border-zinc-200 dark:border-zinc-800 pl-4 ml-2">
                <div className="text-right">
                  <p className="text-xs font-black text-zinc-900 dark:text-white leading-none">{user.displayName || 'Student'}</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">{profile?.role || 'User'}</p>
                </div>
                <button onClick={handleLogout} className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden lg:block px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-zinc-900/20">
                Login
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-3 text-zinc-900 dark:text-white">
              {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-20 bg-white/95 dark:bg-black/95 backdrop-blur-xl z-[60] p-6 space-y-4 animate-in slide-in-from-top-5">
          <Link to="/events" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-xl font-black">
            <Calendar className="w-6 h-6 text-indigo-600" /> Explore
          </Link>
          
          {user && (
            <Link to="/my-tickets" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-xl font-black">
              <Ticket className="w-6 h-6 text-indigo-600" /> My Tickets
            </Link>
          )}

          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-xl font-black text-indigo-600">
              <Shield className="w-6 h-6" /> Organizer Console
            </Link>
          )}

          {profile?.role === 'super_admin' && (
            <Link to="/super-admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/30 text-xl font-black text-red-600">
              <Zap className="w-6 h-6" /> God Mode
            </Link>
          )}

          <div className="pt-8 space-y-4">
            {user ? (
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-[2rem] font-black text-xl">
                <LogOut className="w-6 h-6" /> Logout
              </button>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block w-full text-center py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[2rem] font-black text-2xl">
                Login / Join
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
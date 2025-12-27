import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, User, Menu, X, Sun, Moon, Shield, Zap } from 'lucide-react'; // Added Zap icon

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
              U
            </div>
            <span className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">UniFlow</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/events" className="text-sm font-medium text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">Explore</Link>
            <Link to="/about" className="text-sm font-medium text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">About & Dev</Link>
            
            {user && (
              <Link to="/my-tickets" className="text-sm font-medium text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">My Tickets</Link>
            )}

            {/* Organizer Link */}
            {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
              <Link to="/admin" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Shield className="w-4 h-4" /> Organizer
              </Link>
            )}

            {/* 👑 GOD MODE LINK (Super Admin Only) */}
            {profile?.role === 'super_admin' && (
              <Link to="/super-admin" className="text-sm font-black text-red-600 dark:text-red-400 flex items-center gap-1 animate-pulse">
                <Zap className="w-4 h-4" /> GOD MODE
              </Link>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </div>
                </div>
                <button onClick={handleLogout} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-600 rounded-full transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:scale-105 transition-transform">
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 text-zinc-600 dark:text-zinc-400">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-zinc-900 dark:text-white">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-black border-t border-zinc-100 dark:border-zinc-800 p-4 space-y-4 animate-in slide-in-from-top-5">
          <Link to="/events" className="block py-2 text-zinc-600 dark:text-zinc-300 font-medium" onClick={() => setIsMenuOpen(false)}>Explore Events</Link>
          <Link to="/about" className="block py-2 text-zinc-600 dark:text-zinc-300 font-medium" onClick={() => setIsMenuOpen(false)}>About & Dev</Link>
          
          {user && (
            <Link to="/my-tickets" className="block py-2 text-zinc-600 dark:text-zinc-300 font-medium" onClick={() => setIsMenuOpen(false)}>My Tickets</Link>
          )}

          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <Link to="/admin" className="block py-2 text-indigo-600 font-bold" onClick={() => setIsMenuOpen(false)}>Organizer Dashboard</Link>
          )}

          {profile?.role === 'super_admin' && (
            <Link to="/super-admin" className="block py-2 text-red-600 font-black" onClick={() => setIsMenuOpen(false)}>⚡ GOD MODE</Link>
          )}

          {user ? (
            <button onClick={handleLogout} className="w-full text-left py-2 text-red-500 font-medium">Logout</button>
          ) : (
            <Link to="/login" className="block w-full text-center py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl" onClick={() => setIsMenuOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
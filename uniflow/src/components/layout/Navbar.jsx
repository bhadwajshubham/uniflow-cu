import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, Ticket, LogOut, ShieldCheck, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="text-2xl font-black tracking-tighter italic flex items-center gap-2">
          <span className="text-indigo-600">UNI</span>
          <span className="dark:text-white">FLOW</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/events" className="text-sm font-bold uppercase tracking-widest text-zinc-500 hover:text-indigo-600 transition-colors">Events</Link>
          
          {user ? (
            <>
              {/* Student Links */}
              <Link to="/my-tickets" className="text-sm font-bold uppercase tracking-widest text-zinc-500 hover:text-indigo-600 transition-colors">My Tickets</Link>
              
              {/* Admin Link (Conditional) */}
              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-all">
                  <ShieldCheck className="w-4 h-4" /> Console
                </Link>
              )}

              {/* Profile Dropdown Trigger (Simple Version) */}
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-zinc-200 dark:border-zinc-800">
                <Link to="/profile" className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold hover:scale-110 transition-transform">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </Link>
                <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <Link to="/login" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20">
              Student Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-zinc-600 dark:text-zinc-300">
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-4 shadow-2xl">
          <Link to="/events" onClick={() => setIsMenuOpen(false)} className="py-2 text-sm font-bold uppercase tracking-widest dark:text-white">Explore Events</Link>
          
          {user ? (
            <>
              <Link to="/my-tickets" onClick={() => setIsMenuOpen(false)} className="py-2 text-sm font-bold uppercase tracking-widest dark:text-white flex items-center gap-2">
                <Ticket className="w-4 h-4" /> My Tickets
              </Link>
              <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="py-2 text-sm font-bold uppercase tracking-widest dark:text-white flex items-center gap-2">
                <User className="w-4 h-4" /> My Profile
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="py-2 text-sm font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Admin Console
                </Link>
              )}
              <button onClick={handleLogout} className="py-2 text-sm font-bold uppercase tracking-widest text-red-500 flex items-center gap-2 text-left">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="py-3 bg-indigo-600 text-white text-center rounded-xl font-bold uppercase tracking-widest text-xs">
              Login Now
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
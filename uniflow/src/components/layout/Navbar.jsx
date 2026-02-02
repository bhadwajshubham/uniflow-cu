import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Menu, X, User, LogOut, Ticket, 
  LayoutDashboard, QrCode, LogIn, ShieldAlert 
} from 'lucide-react';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              UniFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/events" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white transition-colors">
              Explore Events
            </Link>
            
            {/* 🔥 SUPER ADMIN: ROOT PANEL LINK */}
            {profile?.role === 'super_admin' && (
              <Link to="/root" className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-black uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                Root Panel
              </Link>
            )}

            {/* 🛠️ ADMIN: DASHBOARD LINK (Super Admin bhi dekh sakta hai) */}
            {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
              <Link to="/admin" className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                {profile?.role === 'super_admin' ? 'Events' : 'Dashboard'}
              </Link>
            )}

            {/* 📷 SCANNER: SCAN LINK */}
            {profile?.role === 'scanner' && (
              <Link to="/scan" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors text-sm font-bold shadow-lg shadow-indigo-500/20">
                <QrCode className="w-4 h-4" />
                Scan Tickets
              </Link>
            )}

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-zinc-200 dark:border-zinc-800">
                <Link to="/profile" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-sm hover:opacity-90 transition-all"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-zinc-600 dark:text-zinc-400"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-4 space-y-4 shadow-xl">
          <Link 
            to="/events" 
            className="block text-zinc-600 dark:text-zinc-400 font-medium p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Explore Events
          </Link>

          {/* SUPER ADMIN MOBILE */}
          {profile?.role === 'super_admin' && (
            <Link 
              to="/root" 
              className="flex items-center gap-2 text-red-600 font-black uppercase p-2 bg-red-50 rounded-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ShieldAlert className="w-4 h-4" />
              Root Panel
            </Link>
          )}

          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <Link 
              to="/admin" 
              className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-medium p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <LayoutDashboard className="w-4 h-4" />
              {profile?.role === 'super_admin' ? 'Manage Events' : 'Admin Dashboard'}
            </Link>
          )}

          {profile?.role === 'scanner' && (
             <Link 
               to="/scan" 
               className="flex items-center gap-2 text-indigo-600 font-bold p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg"
               onClick={() => setIsMobileMenuOpen(false)}
             >
               <QrCode className="w-4 h-4" />
               Scan Tickets
             </Link>
          )}

          {user ? (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 w-full text-left text-red-500 font-medium p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          ) : (
            <Link 
              to="/login"
              className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
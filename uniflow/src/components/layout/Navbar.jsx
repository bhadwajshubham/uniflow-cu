import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ThemeToggle'; 
import { Menu, X, LogOut, QrCode, LayoutDashboard, HelpCircle } from 'lucide-react';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const isAdmin = profile?.role === 'admin';

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">U</span>
              </div>
              <span className="text-xl font-bold text-zinc-900 dark:text-white">UniFlow</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                <NavLink to="/" active={isActive('/')}>Events</NavLink>
                <NavLink to="/my-tickets" active={isActive('/my-tickets')}>Tickets</NavLink>
                
                {isAdmin && (
                  <>
                    <NavLink to="/scan" active={isActive('/scan')} icon={<QrCode className="w-4 h-4 mr-1"/>}>Scan</NavLink>
                    <NavLink to="/admin" active={isActive('/admin')} icon={<LayoutDashboard className="w-4 h-4 mr-1"/>}>Dash</NavLink>
                  </>
                )}

                <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-2"></div>
                <ThemeToggle />
                
                <button onClick={logout} className="ml-2 p-2 text-zinc-500 hover:text-red-500 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <ThemeToggle />
                {/* 🔥 CHANGED TO HELP */}
                <Link to="/help" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600">
                  Help & Support
                </Link>
                <Link to="/login" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-4">
            <ThemeToggle />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-zinc-600 dark:text-zinc-400">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu (Simplified) */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <MobileLink to="/" onClick={() => setIsMenuOpen(false)}>Events</MobileLink>
            <MobileLink to="/my-tickets" onClick={() => setIsMenuOpen(false)}>My Tickets</MobileLink>
            <MobileLink to="/help" onClick={() => setIsMenuOpen(false)}>Help & Support</MobileLink>
            {user && (
              <button onClick={logout} className="block w-full text-left px-3 py-2 text-red-500 font-medium">
                Log Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const NavLink = ({ to, active, children, icon }) => (
  <Link to={to} className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
    {icon}{children}
  </Link>
);

const MobileLink = ({ to, onClick, children }) => (
  <Link to={to} onClick={onClick} className="block px-3 py-2 rounded-md text-base font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
    {children}
  </Link>
);

export default Navbar;
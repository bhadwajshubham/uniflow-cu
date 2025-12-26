import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ThemeToggle'; 
import { Menu, X, QrCode, LayoutDashboard, User } from 'lucide-react';
// 👇 IMPORT PROFILE
import UserProfile from '../../features/auth/components/UserProfile'; 

const Navbar = () => {
  const { user, profile } = useAuth(); // Removed 'logout' because Profile handles it
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // 👇 Profile State
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const isAdmin = profile?.role === 'admin';

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
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

                  <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-3"></div>
                  <ThemeToggle />
                  
                  {/* 👇 PROFILE BUTTON */}
                  <button 
                    onClick={() => setIsProfileOpen(true)}
                    className="ml-3 w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all"
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-zinc-500" />
                    )}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <ThemeToggle />
                  <Link to="/help" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600">
                    Help
                  </Link>
                  <Link to="/login" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20">
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
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-5 duration-200">
            <div className="px-4 pt-2 pb-4 space-y-1">
              <MobileLink to="/" onClick={() => setIsMenuOpen(false)}>Events</MobileLink>
              <MobileLink to="/my-tickets" onClick={() => setIsMenuOpen(false)}>My Tickets</MobileLink>
              {isAdmin && <MobileLink to="/admin" onClick={() => setIsMenuOpen(false)}>Admin Dashboard</MobileLink>}
              <MobileLink to="/help" onClick={() => setIsMenuOpen(false)}>Help & Support</MobileLink>
              
              {user && (
                 <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsProfileOpen(true);
                  }}
                  className="w-full text-left px-3 py-3 mt-2 text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/20 rounded-lg"
                 >
                   View Profile
                 </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* 👇 RENDER PROFILE MODAL GLOBALLY */}
      <UserProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

const NavLink = ({ to, active, children, icon }) => (
  <Link to={to} className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
    {icon}{children}
  </Link>
);

const MobileLink = ({ to, onClick, children }) => (
  <Link to={to} onClick={onClick} className="block px-3 py-3 rounded-lg text-base font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
    {children}
  </Link>
);

export default Navbar;
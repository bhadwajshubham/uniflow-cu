import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ThemeToggle'; 
import { Menu, X, LogOut, QrCode, LayoutDashboard, Info } from 'lucide-react';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // 🔥 TRUTH SERUM: Verify Admin Status in Console
  if (user) {
    console.log("🔎 AUDIT -> User Email:", user.email);
    console.log("🔎 AUDIT -> Firestore Role:", profile?.role);
    console.log("🔎 AUDIT -> Is Admin?", profile?.role === 'admin');
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                <span className="text-white font-bold text-xl">U</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                UniFlow
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <NavLink to="/" active={isActive('/')}>Events</NavLink>
                <NavLink to="/my-tickets" active={isActive('/my-tickets')}>My Tickets</NavLink>
                
                {isAdmin && (
                  <>
                    <NavLink to="/scan" active={isActive('/scan')} icon={<QrCode className="w-4 h-4 mr-1"/>}>
                      Scanner
                    </NavLink>
                    <NavLink to="/admin" active={isActive('/admin')} icon={<LayoutDashboard className="w-4 h-4 mr-1"/>}>
                      Dashboard
                    </NavLink>
                  </>
                )}

                <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-2"></div>
                
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden lg:block">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate max-w-[150px]">
                        {profile?.name || 'Student'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[150px]">
                        {user.email}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-500/20">
                      {profile?.name?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <button onClick={logout} className="p-2 text-zinc-500 hover:text-red-600 rounded-full transition-colors">
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <Link to="/about" className="text-sm font-medium text-zinc-600 hover:text-indigo-600">About</Link>
                <Link to="/login" className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-lg">
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-4">
            <ThemeToggle />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {user ? (
              <>
                <div className="px-3 py-3 mb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{profile?.name || 'User'}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                </div>
                
                <MobileNavLink to="/" onClick={() => setIsMenuOpen(false)}>Discover Events</MobileNavLink>
                <MobileNavLink to="/my-tickets" onClick={() => setIsMenuOpen(false)}>My Tickets</MobileNavLink>
                
                {isAdmin && (
                  <>
                    <MobileNavLink to="/scan" onClick={() => setIsMenuOpen(false)}>Scanner</MobileNavLink>
                    <MobileNavLink to="/admin" onClick={() => setIsMenuOpen(false)}>Dashboard</MobileNavLink>
                  </>
                )}
                 <MobileNavLink to="/about" onClick={() => setIsMenuOpen(false)}>About Dev</MobileNavLink>
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-red-600 mt-4">
                  Sign Out
                </button>
              </>
            ) : (
              <div className="p-4 space-y-3">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block w-full text-center px-4 py-2 rounded-lg bg-indigo-600 text-white">Sign In</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const NavLink = ({ to, active, children, icon }) => (
  <Link to={to} className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${active ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}>
    {icon}{children}
  </Link>
);

const MobileNavLink = ({ to, children, onClick }) => (
  <Link to={to} onClick={onClick} className="block px-3 py-2 rounded-md text-base font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">
    {children}
  </Link>
);

export default Navbar;
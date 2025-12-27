import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, Search, Ticket, User, Menu, X, LogOut, 
  ShieldCheck, LayoutDashboard, ScanLine 
} from 'lucide-react';
import UserProfile from '../../features/auth/components/UserProfile';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Admin Check
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  // Navigation Items
  const navItems = [
    { name: 'Events', path: '/events', icon: <Home className="w-6 h-6" /> },
    { name: 'My Tickets', path: '/my-tickets', icon: <Ticket className="w-6 h-6" /> },
    // Admin Only Items
    ...(isAdmin ? [
      { name: 'Admin', path: '/admin', icon: <LayoutDashboard className="w-6 h-6" /> },
      { name: 'Scan', path: '/scan', icon: <ScanLine className="w-6 h-6" /> }
    ] : [])
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* 🖥️ DESKTOP TOP BAR (Hidden on Mobile) */}
      <nav className="hidden md:flex fixed top-0 w-full bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-50 px-6 py-4 justify-between items-center">
        <Link to="/" className="text-2xl font-black text-indigo-600 tracking-tighter">UniFlow.</Link>
        
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
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <button onClick={() => setIsProfileOpen(true)} className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200 font-bold border border-zinc-200 dark:border-zinc-700">
              {user.displayName?.[0] || <User className="w-5 h-5" />}
            </button>
          ) : (
            <Link to="/login" className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-sm">Login</Link>
          )}
        </div>
      </nav>

      {/* 📱 MOBILE TOP HEADER (Minimal) */}
      <nav className="md:hidden fixed top-0 w-full bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-50 px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-black text-indigo-600 tracking-tighter">UniFlow.</Link>
        {user && (
          <button onClick={() => setIsProfileOpen(true)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full">
            <User className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
          </button>
        )}
      </nav>

      {/* 📱 MOBILE BOTTOM NAVIGATION BAR (The Native Feel) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.path} 
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive(item.path) ? 'text-indigo-600' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              {/* Active Indicator Line */}
              {isActive(item.path) && <div className="absolute top-0 w-8 h-1 bg-indigo-600 rounded-b-full"></div>}
              
              <div className={isActive(item.path) ? "animate-in zoom-in duration-200" : ""}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Profile Modal */}
      <UserProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

export default Navbar;
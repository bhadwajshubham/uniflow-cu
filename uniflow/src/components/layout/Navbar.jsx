import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Calendar, Ticket, User, Plus, Moon, Sun, Zap } from 'lucide-react';

const Navbar = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  const isActive = (path) => location.pathname === path;

  // Helper for Nav Links
  const NavLink = ({ to, icon: Icon, label }) => (
    <Link to={to} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive(to) ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
      <Icon className={`w-6 h-6 ${isActive(to) ? 'fill-current' : ''}`} />
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  );

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. TOP BAR (Visible on ALL screens)
          - Now includes Desktop Navigation!
      ───────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 flex justify-between items-center transition-all">
        
        {/* LEFT: Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">
            UniFlow
          </span>
        </Link>

        {/* CENTER: DESKTOP NAV (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={`text-sm font-bold transition-colors ${isActive('/') ? 'text-indigo-600' : 'text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white'}`}>Home</Link>
            <Link to="/events" className={`text-sm font-bold transition-colors ${isActive('/events') ? 'text-indigo-600' : 'text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white'}`}>Events</Link>
            <Link to="/my-tickets" className={`text-sm font-bold transition-colors ${isActive('/my-tickets') ? 'text-indigo-600' : 'text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white'}`}>My Tickets</Link>
            {isAdmin && <Link to="/admin" className="text-sm font-bold text-indigo-600">Admin</Link>}
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 block dark:hidden" />
          </button>

          {user ? (
            <Link to="/profile" className="flex items-center gap-2">
               <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center overflow-hidden">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 text-xs">
                      {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
               </div>
            </Link>
          ) : (
            <Link to="/login" className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          2. BOTTOM NAVIGATION BAR (Mobile Only)
          - UI FIX: Use 'justify-around' for Students so there is no gap
          - UI FIX: Use 'justify-between' for Admins to fit the + button
      ───────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 pb-safe pt-2 px-6 md:hidden">
        <div className={`flex items-center pb-2 ${isAdmin ? 'justify-between' : 'justify-around'}`}>
          
          <NavLink to="/" icon={Home} label="Home" />
          <NavLink to="/events" icon={Calendar} label="Events" />

          {/* ADMIN ACTION: Create (Only renders if Admin) */}
          {isAdmin && (
             <Link to="/admin/create" className="relative -top-5">
               <div className="w-14 h-14 bg-indigo-600 rounded-full shadow-xl shadow-indigo-500/40 flex items-center justify-center text-white border-4 border-zinc-50 dark:border-zinc-950 transform hover:scale-105 active:scale-95 transition-all">
                 <Plus className="w-7 h-7" />
               </div>
             </Link>
          )}

          {/* If Student, My Tix is just a normal item. If Admin, it pushes to the right. */}
          <NavLink to="/my-tickets" icon={Ticket} label="My Tix" />
          
          {/* If Admin, Show Scan. If Student, Show Profile */}
          {isAdmin ? (
             <NavLink to="/scan" icon={Zap} label="Scan" />
          ) : (
             <NavLink to="/profile" icon={User} label="Profile" />
          )}

        </div>
      </div>
    </>
  );
};

export default Navbar;
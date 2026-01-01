import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Calendar, Ticket, User, Plus, Moon, Sun, LogOut, Zap } from 'lucide-react';

const Navbar = () => {
  const { user, profile, logout } = useAuth(); // Getting user & profile data
  const location = useLocation();
  
  // Quick Dark Mode Toggle Logic (assuming you use a class on HTML tag)
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. TOP BAR (Mobile & Desktop)
          - Logo on Left
          - Profile & Theme Toggle on Right
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

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">
          
          {/* Theme Toggle (Sun/Moon) */}
          <button onClick={toggleTheme} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 block dark:hidden" />
          </button>

          {/* User Profile (If Logged In) */}
          {user ? (
            <Link to="/profile" className="flex items-center gap-2">
               {/* Avatar or Initials */}
               <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center overflow-hidden">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 text-xs">
                      {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
               </div>
            </Link>
          ) : (
            // Login Button (If Not Logged In)
            <Link to="/login" className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          2. BOTTOM NAVIGATION BAR (Mobile Only)
          - Fixed at bottom
          - Glassmorphism
          - "App-like" Dock
      ───────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 pb-safe pt-2 px-6 md:hidden">
        <div className="flex justify-between items-center pb-2">
          
          {/* Home */}
          <Link to="/" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive('/') ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <Home className={`w-6 h-6 ${isActive('/') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold">Home</span>
          </Link>

          {/* Events */}
          <Link to="/events" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive('/events') ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <Calendar className={`w-6 h-6 ${isActive('/events') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold">Events</span>
          </Link>

          {/* ADMIN ACTION: Create (Middle Floating Button) */}
          {profile?.role === 'admin' || profile?.role === 'super_admin' ? (
             <Link to="/admin" className="relative -top-5">
               <div className="w-14 h-14 bg-indigo-600 rounded-full shadow-xl shadow-indigo-500/40 flex items-center justify-center text-white border-4 border-zinc-50 dark:border-zinc-950 transform hover:scale-105 active:scale-95 transition-all">
                 <Plus className="w-7 h-7" />
               </div>
             </Link>
          ) : (
             // If Student, Show Tickets in middle or just spacer
             <Link to="/my-tickets" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive('/my-tickets') ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 hover:text-zinc-600'}`}>
               <Ticket className={`w-6 h-6 ${isActive('/my-tickets') ? 'fill-current' : ''}`} />
               <span className="text-[10px] font-bold">My Tix</span>
             </Link>
          )}

          {/* Scanner (Admin) or Search (Student) - Context dependent, for now keeping Scan logic if Admin */}
          {profile?.role === 'admin' ? (
             <Link to="/scan" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive('/scan') ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 hover:text-zinc-600'}`}>
               <Zap className={`w-6 h-6 ${isActive('/scan') ? 'fill-current' : ''}`} />
               <span className="text-[10px] font-bold">Scan</span>
             </Link>
          ) : (
             // Placeholder for students
              <div className="w-10"></div> 
          )}

          {/* Profile */}
          <Link to="/profile" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive('/profile') ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <User className={`w-6 h-6 ${isActive('/profile') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold">Profile</span>
          </Link>

        </div>
      </div>
    </>
  );
};

export default Navbar;
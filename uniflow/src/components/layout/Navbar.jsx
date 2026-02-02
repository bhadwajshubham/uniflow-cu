import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Calendar, Ticket, User, Moon, Sun, Shield, QrCode, Info, ShieldAlert } from 'lucide-react';

const Navbar = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  
  // 🛡️ ROLE CHECKS
  const isSuperAdmin = profile?.role === 'super_admin';
  const isAdmin = profile?.role === 'admin' || isSuperAdmin; 
  const isScanner = profile?.role === 'scanner';
  
  const canScan = isAdmin || isScanner;

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  const isActive = (path) => location.pathname === path;

  // Helper for Nav Links
  const NavLink = ({ to, icon: Icon, label, danger }) => (
    <Link to={to} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
      isActive(to) 
        ? (danger ? 'text-red-600' : 'text-indigo-600 dark:text-indigo-400') 
        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
    }`}>
      <Icon className={`w-6 h-6 ${isActive(to) ? 'fill-current' : ''}`} />
      <span className={`text-[10px] font-bold ${danger ? 'text-red-500' : ''}`}>{label}</span>
    </Link>
  );

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. TOP BAR (Desktop)
      ───────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 flex justify-between items-center transition-all">
        
        {/* LEFT: Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/pwa-192x192.png" alt="UniFlow" className="w-8 h-8 object-contain rounded-lg group-hover:scale-105 transition-transform" />
          <span className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">UniFlow-CU</span>
        </Link>

        {/* CENTER: DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={`text-sm font-bold ${isActive('/') ? 'text-indigo-600' : 'text-zinc-500'}`}>Home</Link>
            <Link to="/events" className={`text-sm font-bold ${isActive('/events') ? 'text-indigo-600' : 'text-zinc-500'}`}>Events</Link>
            
            {/* ✅ FIXED: Added My Tickets for Logged In Users */}
            {user && (
              <Link to="/my-tickets" className={`text-sm font-bold ${isActive('/my-tickets') ? 'text-indigo-600' : 'text-zinc-500'}`}>My Tickets</Link>
            )}

            <Link to="/about" className={`text-sm font-bold ${isActive('/about') ? 'text-indigo-600' : 'text-zinc-500'}`}>About</Link>
            
            {/* Super Admin Desktop Link */}
            {isSuperAdmin && (
              <Link to="/root" className="text-sm font-black text-red-600 hover:text-red-700 uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" /> Root
              </Link>
            )}

            {isAdmin && <Link to="/admin" className="text-sm font-bold text-indigo-600">Admin</Link>}
            {canScan && <Link to="/scan" className="text-sm font-bold text-indigo-600">Scanner</Link>}
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600"><Sun className="w-5 h-5 hidden dark:block" /><Moon className="w-5 h-5 block dark:hidden" /></button>
          {user ? (
            <Link to="/profile">
               <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border border-indigo-200">
                  {profile?.photoURL ? <img src={profile.photoURL} className="w-full h-full object-cover"/> : <span className="font-bold text-indigo-700">{profile?.displayName?.[0] || 'U'}</span>}
               </div>
            </Link>
          ) : (
            <Link to="/login" className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-bold uppercase">Login</Link>
          )}
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          2. BOTTOM NAVIGATION BAR (Mobile)
      ───────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 pb-safe pt-2 px-4 md:hidden">
        <div className={`flex items-center pb-2 ${isAdmin ? 'justify-between' : 'justify-between gap-1'}`}>
          
          <NavLink to="/" icon={Home} label="Home" />
          <NavLink to="/events" icon={Calendar} label="Events" />

          {/* 🟢 CENTER BUTTON: SCANNER vs MY TIX */}
          {canScan ? (
             <Link to="/scan" className="relative -top-5">
               <div className="w-14 h-14 bg-indigo-600 rounded-full shadow-xl shadow-indigo-500/40 flex items-center justify-center text-white border-4 border-zinc-50 dark:border-zinc-950">
                 <QrCode className="w-7 h-7" />
               </div>
             </Link>
          ) : (
            <NavLink to="/my-tickets" icon={Ticket} label="My Tix" />
          )}

          {/* RIGHT SIDE LOGIC */}
          {isSuperAdmin ? (
            <>
              <NavLink to="/admin" icon={Shield} label="Admin" />
              <NavLink to="/root" icon={ShieldAlert} label="Root" danger />
            </>
          ) 
          : isAdmin ? (
            <>
              <NavLink to="/my-tickets" icon={Ticket} label="My Tix" />
              <NavLink to="/admin" icon={Shield} label="Admin" />
            </>
          ) 
          : isScanner ? (
            <>
              <NavLink to="/my-tickets" icon={Ticket} label="My Tix" />
              <NavLink to="/profile" icon={User} label="Profile" />
            </>
          ) 
          : (
             <>
               <NavLink to="/about" icon={Info} label="About" />
               <NavLink to="/profile" icon={User} label="Profile" />
             </>
          )}

        </div>
      </div>
    </>
  );
};

export default Navbar;
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, LogOut, Menu, X, ScanLine, Trophy, BarChart3, DownloadCloud } from 'lucide-react'; // Added DownloadCloud
import { useState, useEffect } from 'react';

const Layout = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Listen for the 'beforeinstallprompt' event (Chrome/Edge/Android)
    const handler = (e) => {
      e.preventDefault(); // Prevent default mini-infobar
      setDeferredPrompt(e); // Save event for later
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex flex-col">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/events" className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">U</div>
              UniFlow
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-6">
              
              {/* PWA INSTALL BUTTON (Only shows if installable) */}
              {deferredPrompt && (
                <button 
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors animate-pulse"
                >
                  <DownloadCloud className="h-4 w-4" /> Install App
                </button>
              )}

              <Link to="/events" className={`text-sm font-medium ${isActive('/events') ? 'text-indigo-600' : 'text-zinc-500'}`}>Events</Link>
              
              <Link to="/leaderboard" className={`text-sm font-medium flex items-center gap-1 ${isActive('/leaderboard') ? 'text-amber-500 font-bold' : 'text-zinc-500'}`}>
                <Trophy className="h-4 w-4" /> Leaderboard
              </Link>

              <Link to="/tickets" className={`text-sm font-medium ${isActive('/tickets') ? 'text-indigo-600' : 'text-zinc-500'}`}>My Tickets</Link>
              
              {/* ADMIN ONLY LINKS */}
              {userRole === 'admin' && (
                <>
                  <Link to="/scan" className={`flex items-center gap-1 text-sm font-bold ${isActive('/scan') ? 'text-indigo-600' : 'text-zinc-900 dark:text-white'}`}>
                    <ScanLine className="h-4 w-4" /> Scan QR
                  </Link>
                  <Link to="/admin" className={`flex items-center gap-1 text-sm font-bold ${isActive('/admin') ? 'text-indigo-600' : 'text-zinc-900 dark:text-white'}`}>
                    <BarChart3 className="h-4 w-4" /> Dashboard
                  </Link>
                </>
              )}

              <Link to="/profile" className={`text-sm font-medium ${isActive('/profile') ? 'text-indigo-600' : 'text-zinc-500'}`}>Profile</Link>
              
              <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-red-500" title="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 p-4 space-y-4 shadow-xl">
            {/* PWA INSTALL BUTTON MOBILE */}
            {deferredPrompt && (
                <button 
                  onClick={() => { handleInstallClick(); setIsMenuOpen(false); }}
                  className="w-full text-left font-bold text-indigo-600 bg-indigo-50 p-2 rounded flex items-center gap-2"
                >
                  <DownloadCloud className="h-4 w-4" /> Install App
                </button>
            )}

            <Link to="/events" className="block font-medium p-2 rounded hover:bg-zinc-50" onClick={() => setIsMenuOpen(false)}>Events</Link>
            <Link to="/leaderboard" className="block font-medium p-2 text-amber-600" onClick={() => setIsMenuOpen(false)}>🏆 Leaderboard</Link>
            <Link to="/tickets" className="block font-medium p-2 rounded hover:bg-zinc-50" onClick={() => setIsMenuOpen(false)}>My Tickets</Link>
            
            {userRole === 'admin' && (
              <>
                <Link to="/scan" className="block font-bold text-indigo-600 p-2 rounded hover:bg-indigo-50" onClick={() => setIsMenuOpen(false)}>
                  Scan QR Code
                </Link>
                <Link to="/admin" className="block font-bold text-indigo-600 p-2 rounded hover:bg-indigo-50" onClick={() => setIsMenuOpen(false)}>
                  Admin Dashboard
                </Link>
              </>
            )}

            <Link to="/profile" className="block font-medium p-2 rounded hover:bg-zinc-50" onClick={() => setIsMenuOpen(false)}>Profile</Link>
            <button onClick={handleLogout} className="w-full text-left text-red-500 font-medium p-2">Sign Out</button>
          </div>
        )}
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
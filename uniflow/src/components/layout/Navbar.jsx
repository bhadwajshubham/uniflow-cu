import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
// 👇 FIXED IMPORT PATH (Kept exactly as you requested)
import { useAuth } from '../../context/AuthContext'; 
import { 
  Menu, 
  X, 
  User, 
  Ticket, 
  LogOut, 
  ShieldCheck, 
  Sparkles,
  ChevronRight 
} from 'lucide-react';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Added to highlight active routes
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // ✨ Creative Touch: Detect scroll to change navbar opacity/shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  // Helper for active link styling
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* DESIGN NOTE: 
        Changed to 'sticky' so it pushes content down naturally, 
        but kept z-index high. Added dynamic borders based on scroll.
      */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
        ${scrolled 
          ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl shadow-sm border-b border-zinc-200/50 dark:border-zinc-800/50' 
          : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* --- Brand Identity --- */}
          <Link 
            to="/" 
            className="group flex items-center gap-2 relative z-50"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl rotate-3 group-hover:rotate-12 transition-transform duration-300 flex items-center justify-center shadow-indigo-500/30 shadow-lg">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                UNI<span className="text-indigo-600">FLOW</span>
              </span>
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Campus Events
              </span>
            </div>
          </Link>

          {/* --- Desktop Navigation --- */}
          <div className="hidden md:flex items-center bg-zinc-100/50 dark:bg-zinc-900/50 backdrop-blur-sm px-2 py-1.5 rounded-full border border-zinc-200/50 dark:border-zinc-800/50">
            
            <NavLink to="/events" active={isActive('/events')}>
              Explore Events
            </NavLink>
            
            {user && (
              <NavLink to="/my-tickets" active={isActive('/my-tickets')}>
                My Tickets
              </NavLink>
            )}

            {/* Admin Pill */}
            {user && isAdmin && (
              <Link 
                to="/admin" 
                className="ml-2 pl-4 pr-5 py-2 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all
                bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Console
              </Link>
            )}
          </div>

          {/* --- User Actions (Desktop) --- */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 pl-6 border-l border-zinc-200 dark:border-zinc-800">
                {/* Profile Link */}
                <Link 
                  to="/profile" 
                  className="flex items-center gap-3 group"
                >
                  <div className="text-right hidden lg:block">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">
                      {profile?.name || 'Student'}
                    </p>
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                      View Profile
                    </p>
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 group-hover:scale-105 transition-transform">
                      <div className="w-full h-full rounded-full bg-white dark:bg-black overflow-hidden flex items-center justify-center">
                         {user.photoURL ? (
                          <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-indigo-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Logout Button */}
                <button 
                  onClick={handleLogout} 
                  className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="relative px-8 py-3 rounded-full bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest overflow-hidden group shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all"
              >
                <span className="relative z-10 group-hover:tracking-[0.2em] transition-all duration-300">Login</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            )}
          </div>

          {/* --- Mobile Toggle --- */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="md:hidden p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* --- Mobile Menu Overlay --- 
        Design: A slide-down panel with glass effect, keeping the header visible
      */}
      <div 
        className={`fixed inset-x-0 top-20 bottom-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl z-40 md:hidden transition-all duration-300 ease-out transform origin-top
        ${isMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}
      >
        <div className="p-6 flex flex-col gap-2 h-full overflow-y-auto">
          <MobileLink to="/events" onClick={() => setIsMenuOpen(false)}>
            <Sparkles className="w-5 h-5 text-indigo-500" /> Explore Events
          </MobileLink>
          
          {user ? (
            <>
              <MobileLink to="/my-tickets" onClick={() => setIsMenuOpen(false)}>
                <Ticket className="w-5 h-5 text-purple-500" /> My Tickets
              </MobileLink>
              
              <MobileLink to="/profile" onClick={() => setIsMenuOpen(false)}>
                <User className="w-5 h-5 text-blue-500" /> My Profile
              </MobileLink>

              {isAdmin && (
                <div className="my-2 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Admin Access</div>
                  <Link 
                    to="/admin" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="flex items-center justify-between w-full p-3 bg-white dark:bg-black rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800"
                  >
                    <span className="flex items-center gap-2 font-bold text-sm dark:text-white">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" /> Dashboard
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </Link>
                </div>
              )}

              <div className="mt-auto pb-8">
                <button 
                  onClick={handleLogout} 
                  className="w-full py-4 flex items-center justify-center gap-2 text-red-500 font-bold bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </div>
            </>
          ) : (
            <div className="mt-8">
              <Link 
                to="/login" 
                onClick={() => setIsMenuOpen(false)} 
                className="flex items-center justify-center w-full py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-sm shadow-lg shadow-indigo-500/30"
              >
                Login Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// --- Sub-components for cleaner code ---

const NavLink = ({ to, active, children }) => (
  <Link 
    to={to} 
    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300
    ${active 
      ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm' 
      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
    }`}
  >
    {children}
  </Link>
);

const MobileLink = ({ to, onClick, children }) => (
  <Link 
    to={to} 
    onClick={onClick} 
    className="flex items-center gap-4 p-4 rounded-2xl text-lg font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800"
  >
    {children}
  </Link>
);

export default Navbar;
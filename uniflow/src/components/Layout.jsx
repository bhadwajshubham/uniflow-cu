import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle from '../ThemeToggle';
  Menu, 
  X, 
  LogOut, 
  Ticket, 
  Calendar, 
  User, 
  Trophy, 
  QrCode, 
  LayoutDashboard,
  Info 
} from 'lucide-react';
import ThemeToggle from './ThemeToggle'; // <--- Make sure this file exists in components

const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      onClick={() => setIsMenuOpen(false)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive(to)
          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black transition-colors duration-300">
      
      {/* ────────── NAVBAR ────────── */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo Section */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <Ticket className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  UniFlow
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/events" icon={Calendar} label="Events" />
              <NavLink to="/tickets" icon={Ticket} label="My Tickets" />
              <NavLink to="/leaderboard" icon={Trophy} label="Leaderboard" />
              <NavLink to="/profile" icon={User} label="Profile" />
              <NavLink to="/about" icon={Info} label="About" /> {/* <--- New Link */}

              {/* Admin Links */}
              {isAdmin && (
                <>
                  <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-2"></div>
                  <NavLink to="/scan" icon={QrCode} label="Scanner" />
                  <NavLink to="/admin" icon={LayoutDashboard} label="Admin" />
                </>
              )}

              {/* Right Side Actions */}
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-zinc-200 dark:border-zinc-700">
                <ThemeToggle /> {/* <--- Theme Switcher */}
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-zinc-400 dark:hover:text-red-400 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-4 md:hidden">
              <ThemeToggle /> {/* <--- Mobile Theme Switcher */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* ────────── MOBILE MENU ────────── */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Menu
              </div>
              <NavLink to="/events" icon={Calendar} label="Events" />
              <NavLink to="/tickets" icon={Ticket} label="My Tickets" />
              <NavLink to="/leaderboard" icon={Trophy} label="Leaderboard" />
              <NavLink to="/profile" icon={User} label="Profile" />
              <NavLink to="/about" icon={Info} label="About" />

              {isAdmin && (
                <>
                  <div className="my-2 border-t border-zinc-100 dark:border-zinc-800"></div>
                  <div className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Admin Tools
                  </div>
                  <NavLink to="/scan" icon={QrCode} label="Scanner" />
                  <NavLink to="/admin" icon={LayoutDashboard} label="Dashboard" />
                </>
              )}

              <div className="my-2 border-t border-zinc-100 dark:border-zinc-800"></div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ────────── MAIN CONTENT ────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
    </div>
  );
};

export default Layout;
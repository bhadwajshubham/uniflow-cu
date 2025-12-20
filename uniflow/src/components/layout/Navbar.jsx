import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Ticket, Calendar, User, Sun, Moon, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../../context/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Tickets', path: '/tickets', icon: Ticket },
    { name: 'Login', path: '/login', icon: User },
  ];

  return (
    <nav className='fixed top-0 w-full z-50 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-xl transition-colors duration-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          {/* Clean Brand Logo */}
          <Link to='/' className='flex items-center gap-2'>
            <div className='bg-indigo-600 rounded-lg p-1.5'>
              <Zap className='h-5 w-5 text-white fill-current' />
            </div>
            <span className='text-xl font-bold tracking-tight text-slate-900 dark:text-white'>UniFlow</span>
          </Link>

          {/* Desktop Menu */}
          <div className='hidden md:flex items-center gap-8'>
            <div className='flex items-center gap-6'>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={clsx(
                    'text-sm font-semibold transition-colors flex items-center gap-2',
                    location.pathname === link.path ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div className='h-6 w-[1px] bg-slate-200 dark:bg-white/10'></div>
            <button onClick={toggleTheme} className='text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white transition-colors'>
              {theme === 'dark' ? <Sun className='h-5 w-5' /> : <Moon className='h-5 w-5' />}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className='md:hidden flex items-center gap-4'>
            <button onClick={toggleTheme} className='text-slate-500 dark:text-slate-400'>
               {theme === 'dark' ? <Sun className='h-5 w-5' /> : <Moon className='h-5 w-5' />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className='text-slate-900 dark:text-white'>
              {isOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;

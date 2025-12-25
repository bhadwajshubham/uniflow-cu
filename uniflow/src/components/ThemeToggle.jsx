import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-zinc-800 text-yellow-400 hover:bg-zinc-700' 
          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
      } ${className}`}
      title="Toggle Theme"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
};

export default ThemeToggle;
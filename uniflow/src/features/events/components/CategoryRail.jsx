import React from 'react';
import { Code, Music, Trophy, BookOpen, Mic, Palette, Grid } from 'lucide-react';

const categories = [
  { id: 'All', label: 'All', icon: <Grid className="w-5 h-5" />, color: 'bg-zinc-900 text-white' },
  { id: 'Tech', label: 'Tech', icon: <Code className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600' },
  { id: 'Cultural', label: 'Cultural', icon: <Music className="w-5 h-5" />, color: 'bg-pink-100 text-pink-600' },
  { id: 'Sports', label: 'Sports', icon: <Trophy className="w-5 h-5" />, color: 'bg-orange-100 text-orange-600' },
  { id: 'Workshop', label: 'Workshop', icon: <BookOpen className="w-5 h-5" />, color: 'bg-emerald-100 text-emerald-600' },
  { id: 'Seminar', label: 'Seminar', icon: <Mic className="w-5 h-5" />, color: 'bg-violet-100 text-violet-600' },
  { id: 'Art', label: 'Art', icon: <Palette className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-700' },
];

const CategoryRail = ({ activeCategory, onSelect }) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-4 no-scrollbar -mx-4 sm:mx-0">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex flex-col items-center gap-2 min-w-[72px] transition-all duration-200 ${
            activeCategory === cat.id ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'
          }`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${
            activeCategory === cat.id ? 'ring-2 ring-offset-2 ring-indigo-500 shadow-md' : ''
          } ${cat.color}`}>
            {cat.icon}
          </div>
          <span className={`text-xs font-bold ${activeCategory === cat.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
            {cat.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategoryRail;
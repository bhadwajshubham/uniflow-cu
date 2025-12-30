import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Search, Filter, CalendarDays, Zap, Ghost } from 'lucide-react';
import EventCard from '../components/EventCard'; // The 3D Flip Card

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Categories for the "Pill" navigation
  const categories = ['All', 'Tech', 'Cultural', 'Sports', 'Workshop', 'Seminar'];

  useEffect(() => {
    // Real-time listener for instant updates
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter Logic
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          event.organizerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black selection:bg-indigo-500/30 relative overflow-hidden">
      
      {/* 1. AMBIENT BACKGROUND (Subtle Moving Blobs) */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20">
        
        {/* 2. HERO HEADER (Minimalist Typography) */}
        <div className="mb-12 space-y-4 animate-in slide-in-from-bottom-4 duration-700">
           <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em]">
              <Zap className="w-4 h-4 fill-current animate-bounce" />
              <span>Live Campus Feed</span>
           </div>
           <h1 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter italic">
              Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Moments.</span>
           </h1>
        </div>

        {/* 3. FLOATING CONTROL DOCK (Glassmorphism) */}
        <div className="sticky top-24 z-40 mb-12 animate-in slide-in-from-bottom-8 duration-1000">
           <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800 p-2 rounded-[2rem] shadow-2xl flex flex-col md:flex-row gap-2 items-center">
              
              {/* Search */}
              <div className="relative w-full md:w-80 group">
                 <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                 </div>
                 <input 
                   type="text" 
                   placeholder="Find your vibe..." 
                   className="w-full pl-10 pr-4 py-4 bg-transparent border-none text-sm font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-0 outline-none"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-2"></div>

              {/* Filter Pills (Scrollable) */}
              <div className="flex-1 w-full overflow-x-auto custom-scrollbar flex gap-2 pb-2 md:pb-0 px-2 md:px-0">
                 {categories.map((cat) => (
                   <button
                     key={cat}
                     onClick={() => setSelectedCategory(cat)}
                     className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                       selectedCategory === cat 
                         ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg scale-105' 
                         : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                     }`}
                   >
                     {cat}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* 4. THE GRID (With Staggered Entry) */}
        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3].map(i => (
                 <div key={i} className="h-[28rem] bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] animate-pulse"></div>
              ))}
           </div>
        ) : filteredEvents.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-1000">
              {filteredEvents.map((event, index) => (
                 // Stagger Animation: delay based on index
                 <div 
                   key={event.id} 
                   className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards"
                   style={{ animationDelay: `${index * 100}ms` }} 
                 >
                    <EventCard event={event} />
                 </div>
              ))}
           </div>
        ) : (
           // Empty State
           <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                 <Ghost className="w-10 h-10 text-zinc-300" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">No Events Found</h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Try adjusting your filters</p>
              <button 
                onClick={() => {setSearchTerm(''); setSelectedCategory('All');}} 
                className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Clear Filters
              </button>
           </div>
        )}

      </div>
    </div>
  );
};

export default EventsPage;
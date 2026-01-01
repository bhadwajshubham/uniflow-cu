import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase'; // Keep your exact path
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Search, Zap, Ghost, Sparkles, SlidersHorizontal, CalendarRange } from 'lucide-react';
import EventCard from '../components/EventCard'; // Keeping your flip card

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isScrolled, setIsScrolled] = useState(false);

  // Categories
  const categories = ['All', 'Tech', 'Cultural', 'Sports', 'Workshop', 'Seminar'];

  useEffect(() => {
    // 🎨 Scroll listener for dynamic UI changes
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // 🔥 Real-time Data Fetching
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Filter Logic
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          event.organizerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    // 🎨 Base: Added a subtle noise texture overlay for a "premium paper" feel
    <div className="min-h-screen bg-zinc-50 dark:bg-black selection:bg-indigo-500/30 relative">
      
      {/* --- Ambient Background & Texture --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Grain Texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        
        {/* Glowing Orbs */}
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-indigo-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-[4s]"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] bg-purple-500/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse delay-1000 duration-[5s]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-28 pb-20">
        
        {/* --- 1. Editorial Header Section --- */}
        <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-[0.2em] animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
              Live Campus Feed
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.9]">
              FIND YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-300% animate-gradient">
                MOMENT.
              </span>
            </h1>
          </div>
          
          {/* Stat / Decoration */}
          <div className="hidden md:block text-right">
             <div className="text-5xl font-black text-zinc-200 dark:text-zinc-800">
                {events.length < 10 ? `0${events.length}` : events.length}
             </div>
             <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">
               Active Events
             </div>
          </div>
        </div>

        {/* --- 2. Floating Command Center (Sticky) --- */}
        <div className={`sticky top-24 z-30 transition-all duration-500 ease-out ${isScrolled ? '-translate-y-2' : 'translate-y-0'}`}>
          <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 p-2 rounded-2xl md:rounded-full flex flex-col md:flex-row gap-2">
            
            {/* Search Input */}
            <div className="relative group flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search events, artists, vibes..." 
                className="w-full pl-12 pr-4 py-4 bg-transparent border-none text-base font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-0 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-zinc-200 dark:bg-zinc-800 my-3"></div>

            {/* Filter Categories */}
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-2 md:pb-0 px-2">
               {categories.map((cat) => (
                 <button
                   key={cat}
                   onClick={() => setSelectedCategory(cat)}
                   className={`relative px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 flex-shrink-0 ${
                     selectedCategory === cat 
                       ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg scale-105' 
                       : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                   }`}
                 >
                   {cat}
                 </button>
               ))}
            </div>

            {/* Mobile Filter Icon (Visual only) */}
            <div className="md:hidden flex items-center justify-center p-2 text-zinc-400">
               <SlidersHorizontal className="w-5 h-5" />
            </div>

          </div>
        </div>

        {/* --- 3. The Grid --- */}
        <div className="mt-12">
          {loading ? (
            // Skeleton Loading State
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[3/4] rounded-3xl bg-zinc-200 dark:bg-zinc-900 animate-pulse flex flex-col p-6 space-y-4">
                  <div className="w-full h-1/2 bg-zinc-300 dark:bg-zinc-800 rounded-2xl"></div>
                  <div className="w-3/4 h-6 bg-zinc-300 dark:bg-zinc-800 rounded-full"></div>
                  <div className="w-1/2 h-4 bg-zinc-300 dark:bg-zinc-800 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {filteredEvents.map((event, index) => (
                <div 
                  key={event.id} 
                  className="group perspective-1000"
                  style={{ animation: `fadeInUp 0.6s ease-out forwards ${index * 0.1}s`, opacity: 0 }}
                >
                   {/* Design Tweak: Hovering over the container lifts the card slightly 
                      before the 3D flip happens in the child component 
                   */}
                   <div className="transition-transform duration-500 hover:-translate-y-2">
                      <EventCard event={event} />
                   </div>
                </div>
              ))}
            </div>
          ) : (
            // Empty State
            <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
                <Ghost className="relative w-20 h-20 text-indigo-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2">
                It's quiet... too quiet.
              </h3>
              <p className="text-zinc-500 font-medium max-w-md mx-auto mb-8">
                We couldn't find any events matching "<span className="text-indigo-600 font-bold">{searchTerm}</span>" in <span className="text-indigo-600 font-bold">{selectedCategory}</span>.
              </p>
              <button 
                onClick={() => {setSearchTerm(''); setSelectedCategory('All');}} 
                className="group px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* --- Footer Decoration --- */}
        {!loading && filteredEvents.length > 0 && (
          <div className="mt-20 flex justify-center opacity-50">
             <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-px bg-gradient-to-b from-zinc-200 to-transparent dark:from-zinc-800"></div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400">End of Feed</span>
             </div>
          </div>
        )}

      </div>

      {/* Inline styles for custom animations if Tailwind config is missing specific keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 300%;
          animation: gradient 8s ease infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default EventsPage;
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Calendar, MapPin, ArrowRight, Frown, Search, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CategoryRail from './CategoryRail';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, 'events');
        const snapshot = await getDocs(eventsRef);
        if (snapshot.empty) {
          setEvents([]);
          setFilteredEvents([]);
          return;
        }
        const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        eventsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setEvents(eventsData);
        setFilteredEvents(eventsData);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    let result = events;
    if (activeCategory !== 'All') {
      result = result.filter(event => (event.category && event.category === activeCategory) || (!event.category && activeCategory === 'Tech'));
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(lower));
    }
    setFilteredEvents(result);
  }, [activeCategory, searchTerm, events]);

  // 💀 SKELETON LOADER (Replaces Spinner)
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black pb-24">
        {/* Skeleton Header */}
        <div className="bg-zinc-200 dark:bg-zinc-900 pb-10 pt-safe px-4 rounded-b-[2.5rem] h-48 animate-pulse"></div>
        <div className="max-w-7xl mx-auto px-4 -mt-8">
           <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-8 animate-pulse"></div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1, 2, 3, 4, 5, 6].map((i) => (
               <div key={i} className="bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-100 dark:border-zinc-800 h-80">
                 <div className="h-48 bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
                 <div className="p-5 space-y-3">
                   <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 animate-pulse"></div>
                   <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 animate-pulse"></div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-24">
      
      {/* 🎨 THEME-AWARE HEADER */}
      {/* Light: Colorful Indigo | Dark: Minimal Zinc-900 */}
      <div className="bg-indigo-600 dark:bg-zinc-900 pb-10 pt-safe px-4 rounded-b-[2.5rem] shadow-xl relative overflow-hidden transition-colors duration-300">
        
        {/* Light Mode Decorations (Hidden in Dark Mode) */}
        <div className="dark:hidden absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="dark:hidden absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

        <div className="relative z-10 flex justify-between items-center mb-6 mt-4 md:mt-20">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">UniFlow Ecosystem</h1>
            <p className="text-indigo-200 dark:text-zinc-400 text-xs font-medium">Discover what's happening on campus</p>
          </div>
          <button className="p-2 bg-white/20 dark:bg-zinc-800/50 backdrop-blur rounded-full text-white hover:bg-white/30 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search events, workshops..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl shadow-lg shadow-indigo-900/10 dark:shadow-none outline-none font-medium placeholder:text-zinc-400 border border-transparent dark:border-zinc-700 transition-colors"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        
        {/* Category Rail (Already styled for both) */}
        <div className="mb-8">
           <CategoryRail activeCategory={activeCategory} onSelect={setActiveCategory} />
        </div>

        {/* EVENTS GRID */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-24">
            <div className="mx-auto w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4"><Frown className="w-8 h-8 text-zinc-400" /></div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No events found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div 
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)} 
                className="group bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-sm border border-zinc-100 dark:border-zinc-800"
              >
                <div className="h-56 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                  <div className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-black/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                    {event.price > 0 ? `₹${event.price}` : 'Free'}
                  </div>
                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-900"><Calendar className="w-12 h-12 opacity-50" /></div>
                  )}
                  <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/90 backdrop-blur px-3 py-1 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1">
                     <Calendar className="w-3 h-3 text-indigo-500" /> {event.date}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1 line-clamp-1 leading-tight">{event.title}</h3>
                  <div className="flex items-center gap-1 text-xs font-medium text-zinc-400 mb-4"><MapPin className="w-3 h-3" /> {event.location}</div>
                  <div className="flex items-center justify-between pt-4 border-t border-dashed border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">{event.category || 'General'}</span>
                    <span className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:gap-1 transition-all">View Details <ArrowRight className="w-3 h-3 ml-1" /></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Calendar, MapPin, Frown, Search } from 'lucide-react';
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
        const snapshot = await getDocs(collection(db, 'events'));
        if (snapshot.empty) { setEvents([]); setFilteredEvents([]); return; }
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

  if (loading) {
    return <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pt-32 text-center text-zinc-500 font-medium">Loading Campus...</div>;
  }

  return (
    // 🎨 ANTI-EYE STRAIN BACKGROUND: Warm Paper (#FDFBF7)
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pb-24 pt-24 transition-colors duration-500">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Discover</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Find your next experience.</p>
          </div>
          
          {/* Soft Search Bar */}
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search events..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all dark:text-white font-medium shadow-sm hover:shadow-md"
            />
          </div>
        </div>

        {/* Categories */}
        <CategoryRail activeCategory={activeCategory} onSelect={setActiveCategory} />
      </div>

      {/* EVENTS GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-24 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="mx-auto w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3"><Frown className="w-6 h-6 text-zinc-400" /></div>
            <p className="text-zinc-500 font-medium">No events found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div 
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)} 
                className="group bg-white dark:bg-zinc-900 rounded-[1.5rem] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-zinc-100/50 dark:border-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                {/* Image Area */}
                <div className="h-52 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                   {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                   ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800"><Calendar className="w-12 h-12 text-zinc-300" /></div>
                   )}
                   
                   {/* Price Badge (Softened) */}
                   <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm border border-zinc-100 dark:border-zinc-700/50">
                      {event.price > 0 ? `₹${event.price}` : 'Free'}
                   </div>
                </div>

                {/* Content Area */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md">
                      {event.category || 'General'}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-zinc-400">
                       <Calendar className="w-3 h-3" /> {event.date}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 line-clamp-1 leading-tight group-hover:text-indigo-600 transition-colors">
                    {event.title}
                  </h3>
                  
                  <div className="flex items-center gap-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                     <MapPin className="w-3.5 h-3.5" /> 
                     <span className="truncate">{event.location}</span>
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
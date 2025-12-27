import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Calendar, MapPin, ArrowRight, Frown, Search, Filter } from 'lucide-react';
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
    return <div className="min-h-screen bg-[#F8F9FA] dark:bg-black pt-32 text-center text-zinc-500">Loading Campus...</div>;
  }

  return (
    // 🎨 BACKGROUND: Soft Off-White (Not harsh white)
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-black pb-24 pt-24">
      
      {/* 🧹 CLEAN MINIMAL HEADER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Explore</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Find your next experience.</p>
          </div>
          
          {/* 🔍 CLEAN SEARCH BAR */}
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search events..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all dark:text-white font-medium"
            />
          </div>
        </div>

        {/* 🌈 Category Rail */}
        <CategoryRail activeCategory={activeCategory} onSelect={setActiveCategory} />
      </div>

      {/* 🃏 EVENTS GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800">
            <div className="mx-auto w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3"><Frown className="w-6 h-6 text-zinc-400" /></div>
            <p className="text-zinc-500 font-medium">No events found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div 
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)} 
                className="group bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-zinc-100 dark:border-zinc-800 shadow-sm"
              >
                <div className="h-48 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                   {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900"><Calendar className="w-12 h-12 opacity-30" /></div>
                   )}
                   <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm border border-zinc-100 dark:border-zinc-700 uppercase tracking-wide">
                      {event.price > 0 ? `₹${event.price}` : 'Free'}
                   </div>
                </div>

                <div className="p-5">
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">{event.category || 'General'}</div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 line-clamp-1 leading-tight">{event.title}</h3>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-auto">
                     <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-zinc-400" /> {event.date}</span>
                     <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-zinc-400" /> {event.location}</span>
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
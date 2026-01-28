import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Search, Calendar, MapPin, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, orderBy('createdAt', 'desc')); 
        const querySnapshot = await getDocs(q);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const eventsList = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= today; 
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setEvents(eventsList);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || event.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter dark:text-white">Upcoming Events</h1>
        <p className="text-zinc-500 font-medium">Don't miss out on campus life.</p>
      </div>

      <div className="sticky top-20 z-30 bg-zinc-50/90 dark:bg-black/90 backdrop-blur-sm py-2 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Find your vibe..." 
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['All', 'Tech', 'Cultural', 'Sports', 'Workshop'].map(cat => (
            <button 
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                filterCategory === cat 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center pt-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <Link to={`/events/${event.id}`} key={event.id} className="group bg-white dark:bg-zinc-900 rounded-[2rem] p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="h-48 rounded-[1.5rem] overflow-hidden relative mb-4 bg-zinc-100">
                {/* 🛡️ FIX: Safe Image Src */}
                <img 
                  src={(event.imageUrl && event.imageUrl.length > 5) ? event.imageUrl : "https://placehold.co/600x400?text=Event"} 
                  alt={event.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
                <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600">
                  {event.category}
                </div>
              </div>
              <div className="px-2 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-black leading-tight dark:text-white line-clamp-2">{event.title}</h3>
                  <div className="flex flex-col items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-2 min-w-[3.5rem]">
                    <span className="text-[10px] font-black uppercase text-red-500">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-xl font-black dark:text-white">{new Date(event.date).getDate()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                   <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold"><MapPin className="w-4 h-4" /> {event.location}</div>
                   <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold"><Ticket className="w-4 h-4" /> ₹{event.price} • {event.totalTickets - event.ticketsSold} left</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 opacity-50">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-zinc-300" />
          <p className="font-bold text-zinc-400">No upcoming events found.</p>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Calendar, MapPin, ArrowRight, Frown, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // 🔥 SIMPLIFIED QUERY: Fetch everything first, filter in JS to avoid Index errors
        const eventsRef = collection(db, 'events');
        const snapshot = await getDocs(eventsRef);
        
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort by Created Date (Newest first) in Javascript
        eventsData.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA; 
        });

        setEvents(eventsData);
      } catch (err) {
        console.error("Error loading events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // JS Filtering
  const displayedEvents = events.filter(event => {
    if (filter === 'all') return true;
    const eventDate = new Date(event.date);
    const today = new Date();
    return filter === 'upcoming' ? eventDate >= today : eventDate < today;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black pt-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-zinc-500 animate-pulse">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              Discover Events
            </h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              {displayedEvents.length} events scheduled.
            </p>
          </div>

          <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
            {['all', 'upcoming'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  filter === f 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {displayedEvents.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800">
            <div className="mx-auto w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <Frown className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No events found</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-2">
              Looks like the schedule is clear. Check back later!
            </p>
          </div>
        ) : (
          /* Events Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedEvents.map((event) => (
              <div 
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)} 
                className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                {/* Image Section */}
                <div className="h-48 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                  <div className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-black/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-700">
                    {event.price > 0 ? `$${event.price}` : 'Free'}
                  </div>
                  
                  {/* Status Badge */}
                  {new Date(event.date) < new Date() && (
                    <div className="absolute top-4 left-4 z-10 bg-zinc-900/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                      Past Event
                    </div>
                  )}

                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                      <Calendar className="w-12 h-12 opacity-50" />
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 line-clamp-1">
                    {event.title}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <span>{new Date(event.date).toDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      <span>{event.location || 'Campus Center'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs font-medium text-zinc-400">
                      {event.ticketsSold || 0} attending
                    </span>
                    <span className="flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
                      Details <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
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
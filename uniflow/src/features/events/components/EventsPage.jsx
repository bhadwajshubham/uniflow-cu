import React from 'react';
import { useEvents } from '../hooks/useEvents';
import EventCard from './EventCard';
import { Search, CalendarX } from 'lucide-react';

const EventsPage = () => {
  const { events, loading, error } = useEvents();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredEvents = events.filter(event => {
    return event.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           event.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 w-48 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Discover Events</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Explore the latest happenings.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {filteredEvents.length > 0 ? (
        // 🔥 FIX: grid-cols-1 for mobile
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filteredEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-4">
          <CalendarX className="h-16 w-16 text-zinc-300 mx-auto" />
          <h3 className="text-lg font-medium">No events found</h3>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
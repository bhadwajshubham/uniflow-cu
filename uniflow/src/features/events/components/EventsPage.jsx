import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 1. Fetch Events Directly (Simple & Safe)
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const eventsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(eventsData);
      } catch (err) {
        console.error("Error loading events:", err);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-xl font-bold text-gray-500">Loading Events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-red-500 font-bold">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upcoming Events</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Join the latest activities on campus.</p>
        </div>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-xl">
          <p className="text-gray-500 text-lg">No events found.</p>
          <p className="text-sm text-gray-400">Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div 
              key={event.id} 
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Event Image (or Fallback) */}
              <div className="h-48 bg-gray-200 dark:bg-zinc-800 relative">
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Calendar className="h-12 w-12 opacity-20" />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  ${event.price || 'Free'}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                  {event.title}
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location || 'Campus Center'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    <span>{event.ticketsSold || 0} / {event.totalTickets} sold</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
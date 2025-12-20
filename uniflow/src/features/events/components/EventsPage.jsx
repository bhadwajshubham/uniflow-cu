import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, Ticket } from 'lucide-react';
import HeroSection from './HeroSection';
import { useAuth } from '../../../context/AuthContext';
import CreateEventModal from './CreateEventModal';
import EventCard from './EventCard';
import { useEvents } from '../hooks/useEvents';

const EventsPage = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Real-time data fetching
  const { events, loading } = useEvents();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <HeroSection />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-20">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Upcoming Events</h2>
          
          <div className="flex items-center gap-3">
            {/* 1. MY TICKETS BUTTON (Visible to everyone) */}
            <button 
              onClick={() => navigate('/tickets')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-white rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
            >
              <Ticket className="h-5 w-5" />
              <span className="hidden sm:inline">My Tickets</span>
            </button>

            {/* 2. CREATE EVENT BUTTON (Admin Only) */}
            {userRole === 'admin' && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Create Event</span>
              </button>
            )}
          </div>
        </div>

        {/* Content State */}
        {loading ? (
          // SKELETON LOADING
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse"></div>
            ))}
          </div>
        ) : events.length === 0 ? (
          // EMPTY STATE
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No events found</h3>
            <p>Be the first to launch an event on campus!</p>
          </div>
        ) : (
          // REAL DATA GRID
          <div className="grid md:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* Admin Modal */}
      {isModalOpen && (
        <CreateEventModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

export default EventsPage;
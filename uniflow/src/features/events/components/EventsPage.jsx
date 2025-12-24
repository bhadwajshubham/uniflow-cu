import { useState } from 'react';
import { Plus, Ticket, Calendar, History, Search, Filter } from 'lucide-react';
import HeroSection from './HeroSection';
import { useAuth } from '../../../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
// import Announcements from './Announcements'; /* DISABLED TO SAVE DB READS */

// Modals
import CreateEventModal from './CreateEventModal';
import EventCard from './EventCard';
import EventParticipantsModal from './EventParticipantsModal';
import RegisterModal from './RegisterModal';

const EventsPage = () => {
  const { userRole } = useAuth();
  const { events, loading } = useEvents();
  
  // UI State
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [managingEvent, setManagingEvent] = useState(null);
  const [registeringEvent, setRegisteringEvent] = useState(null);

  // --- FILTER LOGIC ---
  const now = new Date();
  
  // 1. Split by time (Upcoming vs Past)
  const timeFilteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return activeTab === 'upcoming' ? eventDate >= now : eventDate < now;
  });

  // 2. Filter by Search & Category
  const displayedEvents = timeFilteredEvents.filter(event => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = event.title.toLowerCase().includes(searchLower) || 
                          (event.clubName && event.clubName.toLowerCase().includes(searchLower));
    
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for dropdown
  const categories = ['All', ...new Set(events.map(e => e.category || 'General'))];

  return (
    <div className="bg-zinc-50 dark:bg-black font-sans min-h-full pb-20">
      
      {/* 1. Announcements Banner - DISABLED TO SAVE RESOURCES */}
      {/* <Announcements /> */}

      {/* 2. Hero Section */}
      <HeroSection />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        
        {/* CONTROL BAR */}
        <div className="flex flex-col gap-6 mb-8">
          
          {/* Row 1: Tabs & Create Button */}
          <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
            <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-1">
              <button 
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'upcoming' ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Calendar className="h-4 w-4" /> Upcoming
              </button>
              <button 
                onClick={() => setActiveTab('past')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'past' ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <History className="h-4 w-4" /> Past
              </button>
            </div>

            {userRole === 'admin' && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
              >
                <Plus className="h-5 w-5" /> Create Event
              </button>
            )}
          </div>

          {/* Row 2: Search & Filter Inputs */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search events by title or club..." 
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Dropdown */}
            <div className="relative w-full md:w-64">
              <Filter className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
              <select 
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm appearance-none cursor-pointer"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* EVENTS GRID */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse"/>)}
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="text-center p-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
               <Search className="h-8 w-8 text-zinc-400"/>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No events found</h3>
            <p className="text-zinc-500 mt-2">Try adjusting your search filters.</p>
            {activeTab === 'past' && <p className="text-xs text-zinc-400 mt-1">You are viewing Past Events.</p>}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedEvents.map(event => (
              <div key={event.id} className={activeTab === 'past' ? 'opacity-75 grayscale hover:grayscale-0 transition-all' : ''}>
                <EventCard 
                  event={event} 
                  onRegister={(e) => setRegisteringEvent(e)}
                  onManage={(e) => setManagingEvent(e)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODALS */}
      {showCreateModal && <CreateEventModal onClose={() => setShowCreateModal(false)} />}
      
      {managingEvent && (
        <EventParticipantsModal 
          eventId={managingEvent.id} 
          eventTitle={managingEvent.title}
          eventData={managingEvent} // <--- Important: Pass full data for Edit/Delete
          onClose={() => setManagingEvent(null)} 
        />
      )}

      {registeringEvent && (
        <RegisterModal 
          event={registeringEvent} 
          onClose={() => setRegisteringEvent(null)} 
        />
      )}
    </div>
  );
};

export default EventsPage;
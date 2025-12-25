import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { Ticket, Calendar, QrCode, Clock, Search, MapPin, XCircle } from 'lucide-react';

const MyTicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'registrations'), 
          where('userId', '==', user.uid)
          // Note: compound queries (where + orderBy) require an index. 
          // If this fails, remove orderBy and sort in JS.
        );
        
        const snapshot = await getDocs(q);
        const ticketData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort manually to avoid index errors for now
        ticketData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        
        setTickets(ticketData);
      } catch (err) {
        console.error("Error fetching tickets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user]);

  // Filter Logic
  const filteredTickets = tickets.filter(ticket => {
    const isPast = new Date(ticket.eventDate) < new Date();
    const matchesTab = activeTab === 'upcoming' ? !isPast : isPast;
    const matchesSearch = ticket.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
      <p className="text-zinc-500">Loading your tickets...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white">My Tickets</h1>
            <p className="text-zinc-500 mt-1">Manage your upcoming events and history.</p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search tickets..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-1">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-2 text-sm font-medium rounded-t-lg transition-all ${
              activeTab === 'upcoming' 
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' 
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={`px-6 py-2 text-sm font-medium rounded-t-lg transition-all ${
              activeTab === 'past' 
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' 
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Past Events
          </button>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
            <Ticket className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">No {activeTab} tickets</h3>
            <p className="text-zinc-500 mt-2">You haven't registered for any events in this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map(ticket => (
              <div key={ticket.id} className="group bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row gap-6 relative overflow-hidden">
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    ticket.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {ticket.status || 'Confirmed'}
                  </span>
                </div>
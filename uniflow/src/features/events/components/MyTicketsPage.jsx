import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { Ticket, Calendar, Clock, Search, MapPin, XCircle, Users, Star } from 'lucide-react';

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
        );
        
        const snapshot = await getDocs(q);
        const ticketData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort manually (Newest first)
        ticketData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
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
    // Safety check for date
    const eventDate = ticket.eventDate ? new Date(ticket.eventDate) : new Date();
    // Normalize dates to ignore time for the "Past" check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    const isPast = eventDate < today;
    
    const matchesTab = activeTab === 'upcoming' ? !isPast : isPast;
    const matchesSearch = (ticket.eventTitle || '').toLowerCase().includes(searchTerm.toLowerCase());
    
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
            <p className="text-zinc-500 mt-1">Access your passes and team codes.</p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search tickets..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-1">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-2 text-sm font-bold rounded-t-lg transition-all ${
              activeTab === 'upcoming' 
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' 
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={`px-6 py-2 text-sm font-bold rounded-t-lg transition-all ${
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
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800">
            <Ticket className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">No {activeTab} tickets</h3>
            <p className="text-zinc-500 mt-2">You haven't registered for any events in this category.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTickets.map(ticket => (
              <div key={ticket.id} className="group bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row gap-6 relative overflow-hidden">
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    ticket.status === 'cancelled' ? 'bg-red-100 text-red-600' : 
                    ticket.status === 'used' ? 'bg-zinc-100 text-zinc-500' : 'bg-green-100 text-green-600'
                  }`}>
                    {ticket.status || 'Confirmed'}
                  </span>
                </div>

                {/* 🔳 REAL QR CODE SECTION */}
                <div className="flex-shrink-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 rounded-2xl w-full md:w-40 h-40 p-3 border border-zinc-200 dark:border-zinc-800">
                   {ticket.status === 'cancelled' ? (
                     <div className="text-center">
                       <XCircle className="w-10 h-10 text-red-300 mx-auto mb-2" />
                       <span className="text-xs font-bold text-red-400 uppercase">Cancelled</span>
                     </div>
                   ) : (
                     /* Zero-Dependency QR Generator (Works instantly) */
                     <img 
                       src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket.id}`} 
                       alt="Ticket QR" 
                       className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-screen opacity-90"
                     />
                   )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* Team Badge */}
                    {ticket.teamCode && (
                       <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wide mb-2">
                         <Users className="w-3 h-3" /> Team Code: {ticket.teamCode}
                       </div>
                    )}

                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 leading-tight">
                      {ticket.eventTitle || "Event Name Unavailable"}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <span>{ticket.eventDate || "TBA"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span>{ticket.eventTime || "TBA"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        <span>{ticket.eventLocation || "Venue to be announced"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 mt-2">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                      ID: {ticket.id.slice(0, 8)}
                    </span>
                    
                    {/* Review Button (For Past Events) */}
                    {activeTab === 'past' && (
                      <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        <Star className="w-3 h-3" /> Write Review
                      </button>
                    )}
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

export default MyTicketsPage;
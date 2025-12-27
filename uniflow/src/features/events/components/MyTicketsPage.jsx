import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { Ticket, Calendar, Clock, Search, MapPin, XCircle, Users, CheckCircle, QrCode } from 'lucide-react';

const MyTicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'registrations'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const ticketData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        ticketData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setTickets(ticketData);
      } catch (err) { console.error("Error fetching tickets:", err); } 
      finally { setLoading(false); }
    };
    fetchTickets();
  }, [user]);

  const filteredTickets = tickets.filter(ticket => {
    const eventDate = ticket.eventDate ? new Date(ticket.eventDate) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const isPast = eventDate < today;
    const matchesTab = activeTab === 'upcoming' ? !isPast : isPast;
    const matchesSearch = (ticket.eventTitle || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) return <div className="min-h-screen pt-24 text-center text-zinc-500">Loading tickets...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-8">My Tickets</h1>
        
        {/* TABS */}
        <div className="flex gap-2 mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-1">
          <button onClick={() => setActiveTab('upcoming')} className={`px-6 py-2 text-sm font-bold rounded-t-lg transition-all ${activeTab === 'upcoming' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-zinc-500'}`}>Upcoming</button>
          <button onClick={() => setActiveTab('past')} className={`px-6 py-2 text-sm font-bold rounded-t-lg transition-all ${activeTab === 'past' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-zinc-500'}`}>Past</button>
        </div>

        {/* LIST */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800">
             <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50"/>
             <p>No tickets found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTickets.map(ticket => (
              <div key={ticket.id} className="group bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden">
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    ticket.status === 'cancelled' ? 'bg-red-100 text-red-600' : 
                    (ticket.status === 'used' || ticket.status === 'attended') ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {(ticket.status === 'used' || ticket.status === 'attended') ? 'CHECKED IN' : ticket.status || 'CONFIRMED'}
                  </span>
                </div>

                {/* QR Section */}
                <div className="flex-shrink-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 rounded-2xl w-full md:w-40 h-40 p-3 border border-zinc-200 dark:border-zinc-800">
                   {(ticket.status === 'used' || ticket.status === 'attended') ? (
                     <div className="text-center">
                       <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                       <span className="text-xs font-bold text-green-600 uppercase">You made it!</span>
                     </div>
                   ) : ticket.status === 'cancelled' ? (
                     <XCircle className="w-12 h-12 text-red-300" />
                   ) : (
                     <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket.id}`} alt="QR" className="w-full h-full object-contain opacity-90" />
                   )}
                </div>

                {/* Content */}
                <div className="flex-1">
                   {ticket.teamCode && <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase mb-2"><Users className="w-3 h-3"/> Team: {ticket.teamCode}</div>}
                   <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">{ticket.eventTitle}</h3>
                   <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1"><Calendar className="w-4 h-4"/><span>{ticket.eventDate}</span></div>
                      <div className="flex items-center gap-1"><MapPin className="w-4 h-4"/><span>{ticket.eventLocation}</span></div>
                   </div>
                   <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[10px] font-mono text-zinc-400">ID: {ticket.id}</div>
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
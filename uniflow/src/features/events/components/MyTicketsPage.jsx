import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { Ticket, Calendar, Clock, Search, MapPin, XCircle, Users, CheckCircle, Award, Star, ExternalLink, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // 👈 Added for navigation
import CertificateModal from './CertificateModal';

const MyTicketsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // 👈 Hook for redirection
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');

  // 🎓 CERTIFICATE STATE
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'registrations'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const ticketData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort manually (Newest first)
        ticketData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setTickets(ticketData);
      } catch (err) { console.error("Error fetching tickets:", err); } 
      finally { setLoading(false); }
    };
    fetchTickets();
  }, [user]);

  // Filter Logic
  const filteredTickets = tickets.filter(ticket => {
    const eventDate = ticket.eventDate ? new Date(ticket.eventDate) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    const isPast = eventDate < today;
    const isCompleted = ticket.status === 'attended' || ticket.status === 'used';

    const matchesTab = activeTab === 'upcoming' 
      ? (!isPast && !isCompleted) 
      : (isPast || isCompleted);

    const matchesSearch = (ticket.eventTitle || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const openCertificate = (ticket) => {
    setSelectedTicket(ticket);
    setIsCertificateOpen(true);
  };

  if (loading) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
      <p className="text-zinc-500">Loading your tickets...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white">My Tickets</h1>
            <p className="text-zinc-500 mt-1">Access your passes and certificates.</p>
          </div>
          
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
          <button onClick={() => setActiveTab('upcoming')} className={`px-6 py-2 text-sm font-bold rounded-t-lg transition-all ${activeTab === 'upcoming' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Upcoming</button>
          <button onClick={() => setActiveTab('past')} className={`px-6 py-2 text-sm font-bold rounded-t-lg transition-all ${activeTab === 'past' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>History</button>
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
                    (ticket.status === 'used' || ticket.status === 'attended') ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {(ticket.status === 'used' || ticket.status === 'attended') ? 'COMPLETED' : ticket.status || 'CONFIRMED'}
                  </span>
                </div>

                {/* 🔳 QR / STATUS SECTION */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 rounded-2xl w-full md:w-40 p-4 border border-zinc-200 dark:border-zinc-800">
                   {(ticket.status === 'used' || ticket.status === 'attended') ? (
                     <div className="text-center">
                       <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                       <span className="text-xs font-bold text-green-600 uppercase">Attended</span>
                       
                       {/* 🎓 CERTIFICATE BUTTON */}
                       <button 
                         onClick={() => openCertificate(ticket)}
                         className="mt-3 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors shadow-lg shadow-indigo-200"
                       >
                         <Award className="w-3 h-3" /> Certificate
                       </button>
                     </div>
                   ) : ticket.status === 'cancelled' ? (
                     <div className="text-center">
                        <XCircle className="w-10 h-10 text-red-300 mx-auto mb-2" />
                        <span className="text-xs font-bold text-red-400 uppercase">Cancelled</span>
                     </div>
                   ) : (
                     <>
                        {/* QR IMAGE */}
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket.id}`} 
                          alt="Ticket QR" 
                          className="w-24 h-24 object-contain mix-blend-multiply dark:mix-blend-screen opacity-90"
                        />
                        {/* 👁️ VIEW PASS BUTTON (Desktop) */}
                        <button 
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          className="mt-3 hidden md:flex text-xs font-bold text-indigo-600 hover:text-indigo-700 items-center gap-1"
                        >
                          View Pass <ExternalLink className="w-3 h-3" />
                        </button>
                     </>
                   )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-center">
                  <div>
                    {ticket.teamCode && (
                       <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wide mb-2 w-fit">
                         <Users className="w-3 h-3" /> Team: {ticket.teamCode}
                       </div>
                    )}

                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 leading-tight">
                      {ticket.eventTitle || "Event Name Unavailable"}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-indigo-500" /><span>{ticket.eventDate || "TBA"}</span></div>
                      <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-500" /><span>{ticket.eventTime || "TBA"}</span></div>
                      <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-500" /><span>{ticket.eventLocation || "Venue"}</span></div>
                    </div>
                  </div>

                  {/* 📱 MOBILE ACTION BUTTON */}
                  <div className="mt-2 md:hidden">
                    {(ticket.status !== 'cancelled' && ticket.status !== 'attended' && ticket.status !== 'used') && (
                        <button 
                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                            className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Open Full Ticket <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                  </div>
                  
                  {/* Desktop ID / Review Footer */}
                  <div className="hidden md:flex pt-4 items-center justify-between border-t border-zinc-100 dark:border-zinc-800 mt-auto">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">ID: {ticket.id.slice(0, 8)}</span>
                    {(activeTab === 'past' || ticket.status === 'attended') && (
                      <button className="text-xs font-bold text-zinc-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                        <Star className="w-3 h-3" /> Rate Event
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <CertificateModal 
          isOpen={isCertificateOpen}
          onClose={() => setIsCertificateOpen(false)}
          userName={selectedTicket?.userName}
          eventTitle={selectedTicket?.eventTitle}
          eventDate={selectedTicket?.eventDate}
          ticketId={selectedTicket?.id}
        />

      </div>
    </div>
  );
};

export default MyTicketsPage;
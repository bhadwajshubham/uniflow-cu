import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; // Added doc, getDoc
import { Loader2, Ticket, Trophy, ArrowLeft, Award, Trash2, Star, Search, Filter, ExternalLink } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import CertificateModal from './CertificateModal';
import ReviewModal from './ReviewModal';
import { cancelRegistration } from '../services/registrationService';

const MyTicketsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); 

  // Modal States
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [reviewTicket, setReviewTicket] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, [currentUser]);

  const fetchTickets = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'registrations'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const ticketsWithDetails = await Promise.all(querySnapshot.docs.map(async (ticketDoc) => {
        const ticketData = ticketDoc.data();
        
        // Fetch the EVENT details to get the privateLink
        // (Optimally we could copy privateLink to ticket on registration, but fetching ensures it's up to date)
        const eventRef = doc(db, 'events', ticketData.eventId);
        const eventSnap = await getDoc(eventRef);
        const eventData = eventSnap.exists() ? eventSnap.data() : {};

        return { 
          id: ticketDoc.id, 
          ...ticketData,
          privateLink: eventData.privateLink || null // <--- Attach link here
        };
      }));

      // Sort
      ticketsWithDetails.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
      setTickets(ticketsWithDetails);

    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (ticket) => {
    if (!window.confirm("Are you sure?")) return;
    setCancellingId(ticket.id);
    try {
      await cancelRegistration(ticket.id, ticket.eventId);
      setTickets(prev => prev.filter(t => t.id !== ticket.id));
    } catch (error) {
      alert("Failed to cancel.");
    } finally {
      setCancellingId(null);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.eventTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : statusFilter === 'Attended' ? ticket.status === 'attended' : ticket.status === 'confirmed';
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 md:p-12 font-sans">
      
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/events')} className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
          </button>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">My Ticket Wallet</h1>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
             <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="relative w-40">
             <select className="w-full h-full pl-4 pr-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none appearance-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
               <option value="All">All Tickets</option>
               <option value="Upcoming">Upcoming</option>
               <option value="Attended">History</option>
             </select>
             <Filter className="absolute right-3 top-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <Ticket className="h-12 w-12 mx-auto text-zinc-300 mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No tickets found</h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map(ticket => (
              <div key={ticket.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${ticket.status === 'attended' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>

                <div className="flex-1 text-center md:text-left pl-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase mb-3 ${ticket.status === 'attended' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-600'}`}>
                    {ticket.status === 'confirmed' ? 'Upcoming' : 'Attended'}
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{ticket.eventTitle}</h3>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                     Date: {new Date(ticket.eventDate).toLocaleDateString()}
                  </div>
                  
                  {/* --- NEW: PRIVATE LINK BUTTON --- */}
                  {ticket.privateLink && ticket.status === 'confirmed' && (
                    <div className="mb-4">
                      <a 
                        href={ticket.privateLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold rounded-xl hover:bg-emerald-200 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" /> Join WhatsApp/Group
                      </a>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                    {ticket.status === 'attended' && (
                        <button onClick={() => setSelectedCertificate(ticket)} className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg"><Award className="h-4 w-4" /> Certificate</button>
                    )}
                    {ticket.status === 'attended' && (
                        <button onClick={() => setReviewTicket(ticket)} className="flex items-center gap-2 text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg"><Star className="h-4 w-4" /> Rate Event</button>
                    )}
                    {ticket.status === 'confirmed' && (
                        <button onClick={() => handleCancel(ticket)} disabled={cancellingId === ticket.id} className="flex items-center gap-2 text-sm font-bold text-red-500 px-3 py-1.5 rounded-lg"><Trash2 className="h-4 w-4" /> Cancel</button>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-auto bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center min-w-[200px]">
                   {ticket.type === 'individual' ? (
                      <>
                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Entry Pass</div>
                        <div className="text-lg font-bold text-zinc-900 dark:text-white">Individual</div>
                      </>
                   ) : (
                      <>
                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Team Code</div>
                        <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{ticket.teamCode}</div>
                      </>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCertificate && <CertificateModal ticket={selectedCertificate} onClose={() => setSelectedCertificate(null)} />}
      {reviewTicket && <ReviewModal ticket={reviewTicket} onClose={() => setReviewTicket(null)} />}
    </div>
  );
};

export default MyTicketsPage;
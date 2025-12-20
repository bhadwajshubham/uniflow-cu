import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, Ticket, MapPin, Calendar, Trophy, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyTicketsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!currentUser) return;
      
      try {
        // 1. Get all registrations for this user
        const q = query(
          collection(db, 'registrations'), 
          where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        
        const myTickets = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTickets(myTickets);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 md:p-12 font-sans">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center gap-4">
        <button 
          onClick={() => navigate('/events')}
          className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
        </button>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">My Ticket Wallet</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <Ticket className="h-12 w-12 mx-auto text-zinc-300 mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No tickets yet</h3>
            <p className="text-zinc-500 mb-6">Register for an event to see it here.</p>
            <button 
              onClick={() => navigate('/events')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {tickets.map(ticket => (
              <div key={ticket.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                
                {/* Left: Event Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase mb-3">
                    {ticket.status}
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{ticket.eventTitle}</h3>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1"><Ticket className="h-4 w-4" /> ID: {ticket.id.slice(0, 8)}...</span>
                    {/* We could fetch date/location here too if we saved it, keeping it simple for now */}
                  </div>
                </div>

                {/* Right: The Ticket / Team Code */}
                <div className="w-full md:w-auto bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center min-w-[200px]">
                  {ticket.type === 'team_leader' ? (
                    <>
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Trophy className="h-3 w-3" /> Team Code
                      </div>
                      <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-widest font-mono">
                         {ticket.teamCode || 'ERR'}
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">{ticket.teamName}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Entry Pass</div>
                      <div className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Confirmed
                      </div>
                    </>
                  )}
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
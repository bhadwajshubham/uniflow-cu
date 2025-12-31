import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { Loader2, Calendar, MapPin, Clock, User, ArrowLeft, Download, Share2 } from 'lucide-react';

const TicketPage = () => {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      if (!user || !ticketId) return;
      
      try {
        const docRef = doc(db, 'registrations', ticketId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError('Ticket not found.');
          return;
        }

        const data = docSnap.data();

        // Security Check: Ensure this ticket belongs to the user
        if (data.userId !== user.uid) {
           setError('Unauthorized: This ticket does not belong to you.');
           return;
        }

        setTicket({ id: docSnap.id, ...data });
      } catch (err) {
        console.error("Ticket fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId, user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <User className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase">Access Denied</h2>
      <p className="text-zinc-500 mt-2 mb-6">{error}</p>
      <button onClick={() => navigate('/my-tickets')} className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm uppercase tracking-widest">
        Back to My Tickets
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4">
      <div className="max-w-md mx-auto relative">
        
        {/* Back Button */}
        <button onClick={() => navigate('/my-tickets')} className="absolute -top-12 left-0 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* TICKET CARD */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 relative">
          
          {/* Status Bar */}
          <div className={`h-3 w-full ${
             ticket.status === 'attended' ? 'bg-green-500' : 
             ticket.status === 'cancelled' ? 'bg-red-500' : 'bg-indigo-600'
          }`}></div>

          <div className="p-8 text-center">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white uppercase leading-tight mb-2">
              {ticket.eventTitle}
            </h1>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">
              Official Entry Pass
            </p>

            {/* QR CODE */}
            <div className="bg-white p-4 rounded-2xl shadow-inner border border-zinc-100 inline-block mb-8">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticket.id}`} 
                alt="Ticket QR" 
                className="w-48 h-48 object-contain mix-blend-multiply"
              />
            </div>
            
            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-8">
              ID: {ticket.id}
            </p>

            {/* DETAILS GRID */}
            <div className="grid grid-cols-2 gap-4 text-left bg-zinc-50 dark:bg-zinc-950/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
               <div>
                 <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Date</p>
                 <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm">
                   <Calendar className="w-3 h-3 text-indigo-500" /> {ticket.eventDate}
                 </div>
               </div>
               <div>
                 <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Time</p>
                 <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm">
                   <Clock className="w-3 h-3 text-indigo-500" /> {ticket.eventTime}
                 </div>
               </div>
               <div className="col-span-2">
                 <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Venue</p>
                 <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm">
                   <MapPin className="w-3 h-3 text-indigo-500" /> {ticket.eventLocation}
                 </div>
               </div>
               <div className="col-span-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 mt-2">
                 <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Attendee</p>
                 <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm">
                   <User className="w-3 h-3 text-indigo-500" /> {ticket.userName}
                 </div>
                 <p className="text-[10px] text-zinc-500 mt-1 pl-5">{ticket.rollNo} • {ticket.branch}</p>
               </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-zinc-50 dark:bg-black p-6 flex gap-3 border-t border-zinc-200 dark:border-zinc-800">
             <button className="flex-1 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors dark:text-white">
               <Share2 className="w-3 h-3" /> Share
             </button>
             <button className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
               <Download className="w-3 h-3" /> Save
             </button>
          </div>
        </div>
        
        <p className="text-center text-[10px] font-bold text-zinc-400 uppercase mt-8 tracking-widest">
          Show this QR code at the entrance
        </p>

      </div>
    </div>
  );
};

export default TicketPage;
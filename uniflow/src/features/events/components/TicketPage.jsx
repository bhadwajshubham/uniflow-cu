import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react'; // npm install qrcode.react
import { Loader2, Calendar, MapPin, Clock, Download, ArrowLeft, Ticket as TicketIcon } from 'lucide-react';
import CertificateModal from '../../tickets/components/CertificateModal';

const TicketPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const ticketRef = doc(db, 'registrations', ticketId);
        const ticketSnap = await getDoc(ticketRef);

        if (ticketSnap.exists()) {
          setTicket({ id: ticketSnap.id, ...ticketSnap.data() });
        } else {
          alert("Ticket not found!");
          navigate('/my-tickets');
        }
      } catch (err) {
        console.error("Error fetching ticket:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Loading Access Pass...</p>
      </div>
    </div>
  );

  if (!ticket) return null;

  // 🕒 Logic: Only show certificate if event is passed OR user checked in
  // For demo/MVP, we can also check if date < today
  const eventDateObj = new Date(ticket.eventDate);
  const today = new Date();
  const isEventCompleted = today > eventDateObj || ticket.checkedIn === true;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 flex flex-col items-center justify-center relative">
      
      {/* Back Button */}
      <button onClick={() => navigate('/my-tickets')} className="absolute top-6 left-6 p-3 bg-white dark:bg-zinc-900 rounded-full shadow-sm hover:scale-105 transition-transform z-10">
        <ArrowLeft className="w-5 h-5 dark:text-white" />
      </button>

      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 relative">
        
        {/* Ticket Header */}
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter relative z-10">
            {ticket.eventTitle}
          </h1>
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-2 relative z-10">Official Entry Pass</p>
        </div>

        {/* Ticket Body */}
        <div className="p-8 flex flex-col items-center gap-6">
           
           {/* QR Code Section */}
           <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-zinc-200 shadow-sm">
              <QRCodeSVG value={ticket.id} size={180} />
           </div>
           <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">ID: {ticket.id}</p>

           {/* Event Details */}
           <div className="w-full space-y-4">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                    <Calendar className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Date</p>
                    <p className="font-bold dark:text-white">{ticket.eventDate}</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                    <MapPin className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Venue</p>
                    <p className="font-bold dark:text-white">{ticket.eventLocation || "On Campus"}</p>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                    <Clock className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Time</p>
                    <p className="font-bold dark:text-white">{ticket.eventTime || "TBA"}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 bg-zinc-50 dark:bg-black/20 border-t border-zinc-100 dark:border-zinc-800">
           {isEventCompleted ? (
             <button 
               onClick={() => setIsCertificateOpen(true)}
               className="w-full py-4 bg-[#D4AF37] hover:bg-yellow-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               <Download className="w-4 h-4" /> Download Certificate
             </button>
           ) : (
             <div className="w-full py-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
               <TicketIcon className="w-4 h-4" /> Certificate Locked
             </div>
           )}
        </div>

      </div>

      {/* 📜 CERTIFICATE MODAL */}
      <CertificateModal 
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        userName={ticket.userName}
        eventTitle={ticket.eventTitle}
        eventDate={ticket.eventDate}
        ticketId={ticket.id}
      />

    </div>
  );
};

export default TicketPage;
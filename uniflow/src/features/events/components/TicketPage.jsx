import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { 
  ArrowLeft, Calendar, MapPin, Clock, User, 
  Hash, Loader2, Share2, Download, ShieldCheck 
} from 'lucide-react';
import html2canvas from 'html2canvas';
// ✅ FIX: Use QRCodeCanvas instead of <img> for PDF export
import { QRCodeCanvas } from 'qrcode.react';

const TicketPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const ticketRef = useRef(null);
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        if (!ticketId) return;
        setLoading(true);
        
        // ✅ Fetch Ticket
        const docRef = doc(db, 'tickets', ticketId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setTicket({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Ticket not found.");
        }
      } catch (err) {
        console.error("Error fetching ticket:", err);
        setError("Could not load ticket.");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  // 📥 Download Function (Now works with QR)
  const handleDownload = async () => {
    if (ticketRef.current) {
      // Use useCORS: true just in case, though canvas fixes the main issue
      const canvas = await html2canvas(ticketRef.current, { 
          backgroundColor: '#ffffff',
          useCORS: true,
          scale: 2 // Better Quality
      });
      const link = document.createElement('a');
      link.download = `Ticket_${ticket.eventName || 'Event'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
      <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading Pass...</p>
    </div>
  );

  if (error || !ticket) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <Hash className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Ticket Not Found</h2>
      <p className="text-zinc-500 mb-6 max-w-xs mx-auto">This ticket link might be invalid or expired.</p>
      <button onClick={() => navigate('/my-tickets')} className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold uppercase tracking-widest text-xs">
        Go Back
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black py-12 px-4 sm:px-6">
      
      {/* Navbar / Back */}
      <div className="max-w-md mx-auto mb-6 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2">
            <button onClick={handleDownload} className="p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm hover:scale-105 transition-transform text-indigo-600">
                <Download className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* 🎫 TICKET CARD */}
      <div ref={ticketRef} className="max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative">
        
        {/* Event Header Image Area */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            <div className="absolute bottom-4 left-6 text-white">
                <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
                    Official Pass
                </span>
            </div>
        </div>

        <div className="p-6 relative">
            {/* Event Title */}
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white uppercase leading-tight mb-4">
                {ticket.eventName || ticket.eventTitle}
            </h1>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3"/> Date</p>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                        {ticket.eventDate ? new Date(ticket.eventDate).toLocaleDateString() : 'TBA'}
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3"/> Time</p>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                        {ticket.eventTime || 'TBA'}
                    </p>
                </div>
                <div className="col-span-2 space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1"><MapPin className="w-3 h-3"/> Venue</p>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                        {ticket.eventVenue || ticket.eventLocation || 'Venue to be announced'}
                    </p>
                </div>
            </div>

            {/* Dotted Divider */}
            <div className="relative flex items-center justify-between py-4">
                <div className="w-4 h-4 bg-zinc-100 dark:bg-black rounded-full -ml-8"></div>
                <div className="flex-1 border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 mx-2"></div>
                <div className="w-4 h-4 bg-zinc-100 dark:bg-black rounded-full -mr-8"></div>
            </div>

            {/* Attendee Info & QR */}
            <div className="pt-2 flex flex-col items-center text-center space-y-6">
                
                <div className="w-full bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Attendee</span>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                    </div>
                    <div className="text-left">
                        <p className="text-lg font-black text-zinc-900 dark:text-white">{ticket.userName || 'Student'}</p>
                        <p className="text-xs font-mono text-zinc-500">{ticket.userRollNo || 'ID: N/A'}</p>
                    </div>
                </div>

                {/* ✅ QR CODE (Using QRCodeCanvas) */}
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                    <QRCodeCanvas 
                        value={ticket.id} 
                        size={180}
                        level={"H"} // High Error Correction
                        includeMargin={true}
                    />
                </div>
                
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Scan at entry</p>
                    <p className="text-[10px] font-mono text-zinc-300 bg-zinc-900 px-2 py-1 rounded">
                        ID: {ticket.id}
                    </p>
                </div>

            </div>
        </div>

        {/* Status Bar */}
        <div className={`h-2 w-full ${ticket.scanned ? 'bg-green-500' : 'bg-indigo-500'}`}></div>
      </div>

    </div>
  );
};

export default TicketPage;
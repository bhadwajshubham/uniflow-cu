import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { 
  ArrowLeft, Calendar, MapPin, Clock, 
  Hash, Loader2, Download, ShieldCheck 
} from 'lucide-react';
import html2canvas from 'html2canvas';
// ✅ Using QRCodeCanvas for reliable rendering
import { QRCodeCanvas } from 'qrcode.react';

const TicketPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const ticketRef = useRef(null);
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        if (!ticketId) return;
        setLoading(true);
        
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

  // 📥 Download Function (With Delay Fix)
  const handleDownload = async () => {
    if (ticketRef.current) {
      setDownloading(true);
      
      try {
        // 🕒 Wait 500ms to ensure QR is fully rendered on screen
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(ticketRef.current, { 
            backgroundColor: '#ffffff', // Force White Background
            useCORS: true,              // Allow external images
            scale: 2,                   // High Resolution
            logging: true,
            windowWidth: 1200           // Trick it to think it's Desktop (Fixes Mobile Layout issues)
        });

        const link = document.createElement('a');
        link.download = `Ticket_${ticket.eventName || 'Event'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error("Download failed", err);
        alert("Failed to download ticket. Please take a screenshot instead.");
      } finally {
        setDownloading(false);
      }
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
      <button onClick={() => navigate('/my-tickets')} className="mt-4 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold uppercase tracking-widest text-xs">
        Go Back
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black py-12 px-4 sm:px-6">
      
      {/* Navbar / Back Button */}
      <div className="max-w-md mx-auto mb-6 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2">
            <button 
                onClick={handleDownload} 
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
            >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />}
                {downloading ? 'Saving...' : 'Download'}
            </button>
        </div>
      </div>

      {/* 🎫 TICKET CARD (Capturing This) */}
      <div className="flex justify-center">
          <div 
            ref={ticketRef} 
            id="ticket-card"
            className="w-full max-w-[400px] bg-white rounded-3xl overflow-hidden shadow-2xl relative"
            // 🔥 FORCE STYLING FOR PDF EXPORT
            style={{ backgroundColor: '#ffffff', color: '#000000' }} 
          >
            
            {/* Header (Inline Styles for reliability) */}
            <div 
                className="h-32 relative flex items-end p-6"
                style={{ background: 'linear-gradient(to right, #4f46e5, #9333ea)' }}
            >
                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                
                <div className="relative z-10 text-white">
                    <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
                        Official Pass
                    </span>
                </div>
            </div>

            <div className="p-6 relative bg-white">
                {/* Event Title */}
                <h1 className="text-2xl font-black text-black uppercase leading-tight mb-4">
                    {ticket.eventName || ticket.eventTitle}
                </h1>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3"/> Date</p>
                        <p className="font-bold text-black text-sm">
                            {ticket.eventDate ? new Date(ticket.eventDate).toLocaleDateString() : 'TBA'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3"/> Time</p>
                        <p className="font-bold text-black text-sm">
                            {ticket.eventTime || 'TBA'}
                        </p>
                    </div>
                    <div className="col-span-2 space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><MapPin className="w-3 h-3"/> Venue</p>
                        <p className="font-bold text-black text-sm">
                            {ticket.eventVenue || ticket.eventLocation || 'Venue to be announced'}
                        </p>
                    </div>
                </div>

                {/* Dotted Divider */}
                <div className="border-t-2 border-dashed border-gray-200 my-6"></div>

                {/* Attendee Info & QR */}
                <div className="flex flex-col items-center text-center space-y-6">
                    
                    <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attendee</span>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                        </div>
                        <div className="text-left">
                            <p className="text-lg font-black text-black">{ticket.userName || 'Student'}</p>
                            <p className="text-xs font-mono text-gray-500">{ticket.userRollNo || 'ID: N/A'}</p>
                        </div>
                    </div>

                    {/* ✅ QR CODE (Canvas) */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm inline-block">
                        <QRCodeCanvas 
                            value={ticket.id} 
                            size={180}
                            level={"H"}
                            includeMargin={true}
                            bgColor={"#ffffff"}
                            fgColor={"#000000"}
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scan at entry</p>
                        <p className="text-[10px] font-mono text-gray-400">
                            ID: {ticket.id.slice(0, 15)}...
                        </p>
                    </div>

                </div>
            </div>

            {/* Bottom Color Bar */}
            <div className={`h-3 w-full ${ticket.scanned ? 'bg-green-500' : 'bg-indigo-600'}`}></div>
          </div>
      </div>

    </div>
  );
};

export default TicketPage;
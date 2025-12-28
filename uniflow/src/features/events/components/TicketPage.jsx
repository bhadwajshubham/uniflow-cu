import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.svg';
import { 
  ArrowLeft, Download, Share2, MapPin, Calendar, 
  Clock, ShieldCheck, ShieldAlert, Zap 
} from 'lucide-react';

const TicketPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      // 🛡️ SECURITY PATCH: Wait for auth to load before attempting fetch
      if (!user && !profile) return; 

      try {
        const docRef = doc(db, 'registrations', ticketId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // 🛡️ SECURITY PATCH: Check permissions BEFORE setting state to prevent DevTools leakage
          const isOwner = user?.uid === data.userId;
          const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

          if (isOwner || isAdmin) {
            setTicket({ id: docSnap.id, ...data });
          } else {
            console.error("Unauthorized IDOR attempt detected.");
          }
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId, user, profile]);

  if (loading) return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black flex items-center justify-center">
      <div className="text-center">
        <Zap className="w-12 h-12 text-indigo-600 animate-pulse mx-auto mb-4" />
        <p className="font-black text-[10px] uppercase tracking-[0.3em] text-indigo-600">Generating Secure Pass...</p>
      </div>
    </div>
  );

  // 🛡️ SECURITY PATCH: Final render guard
  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-black flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-4" />
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Access Denied</h1>
        <p className="text-zinc-500 text-sm mt-2 max-w-xs">You do not have permission to view this ticket or it does not exist.</p>
        <button onClick={() => navigate('/my-tickets')} className="mt-8 px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest">Return to Passes</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pt-24 pb-12 px-6">
      <div className="max-w-md mx-auto">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-indigo-600 transition-colors font-bold text-xs uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* PREMIUM WALLET PASS UI */}
        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 relative group animate-in slide-in-from-bottom-8 duration-700">
          
          {/* Header Section */}
          <div className="p-10 pb-6 text-center border-b border-dashed border-zinc-200 dark:border-zinc-800 relative">
            <div className="absolute -left-4 -bottom-4 w-8 h-8 bg-[#FDFBF7] dark:bg-black rounded-full border border-zinc-100 dark:border-zinc-800"></div>
            <div className="absolute -right-4 -bottom-4 w-8 h-8 bg-[#FDFBF7] dark:bg-black rounded-full border border-zinc-100 dark:border-zinc-800"></div>
            
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-2">Verified University Pass</p>
            <h1 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase leading-none">{ticket.eventTitle}</h1>
            <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-black/40 rounded-xl w-fit mx-auto">
               <ShieldCheck className="w-4 h-4 text-green-500" />
               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{ticket.status} Entry</span>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="p-10 bg-zinc-50/50 dark:bg-black/20 flex flex-col items-center border-b border-dashed border-zinc-200 dark:border-zinc-800 relative">
             <div className="absolute -left-4 -bottom-4 w-8 h-8 bg-[#FDFBF7] dark:bg-black rounded-full"></div>
             <div className="absolute -right-4 -bottom-4 w-8 h-8 bg-[#FDFBF7] dark:bg-black rounded-full"></div>
             
             <div className="p-6 bg-white rounded-[2.5rem] shadow-xl group-hover:scale-105 transition-transform duration-500">
                <QRCodeSVG value={ticket.id} size={180} level="H" includeMargin={false} />
             </div>
             <p className="mt-6 font-mono text-xs text-zinc-400 tracking-[0.5em] uppercase">{ticket.id.substring(0, 12)}</p>
          </div>

          {/* Details Section */}
          <div className="p-10 space-y-6">
             <div className="grid grid-cols-2 gap-8">
                <div>
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Attendee</p>
                   <p className="font-bold text-zinc-900 dark:text-white uppercase truncate">{ticket.userName}</p>
                </div>
                <div>
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Roll No</p>
                   <p className="font-bold text-zinc-900 dark:text-white">{ticket.rollNo}</p>
                </div>
             </div>

             <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-black/40 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-indigo-600 shadow-sm"><MapPin className="w-5 h-5" /></div>
                <div>
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Venue</p>
                   <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{ticket.eventLocation}</p>
                </div>
             </div>
          </div>
        </div>
        
        {/* Support Link */}
        <p className="mt-8 text-center text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Powered by UniFlow Secure Gateway</p>
      </div>
    </div>
  );
};

export default TicketPage;
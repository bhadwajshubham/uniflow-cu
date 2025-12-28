import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import QRCode from 'react-qr-code';
import { 
  Calendar, MapPin, Clock, ArrowLeft, Download, ShieldCheck, 
  Share2, Check, User, Users, ShieldAlert 
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const TicketPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const docRef = doc(db, 'registrations', ticketId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTicket({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: ticket.eventTitle,
          text: `Check out my ticket for ${ticket.eventTitle}!`,
          url: window.location.href,
        });
      } catch (err) { console.log("Share dismissed"); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-indigo-500 font-black tracking-widest">GENERATING PASS...</div>;
  if (!ticket) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Ticket not found</div>;

  const isOwner = user && ticket.userId === user.uid;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  if (!isOwner && !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-500 p-4 text-center">
        <ShieldAlert className="w-16 h-16 mb-4" />
        <h1 className="text-2xl font-black uppercase tracking-tighter">Access Denied</h1>
        <p className="text-zinc-500 mt-2 font-medium">This encrypted ticket belongs to another student.</p>
        <button onClick={() => navigate('/')} className="mt-8 px-8 py-3 bg-zinc-800 text-white rounded-2xl font-bold">Return Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black flex flex-col items-center pt-24 pb-12 px-6 transition-colors duration-500">
      
      <button onClick={() => navigate('/my-tickets')} className="mb-8 flex items-center gap-2 text-zinc-500 font-bold hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to My Tickets
      </button>

      {/* 🎫 PREMIUM WALLET TICKET */}
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] dark:shadow-none overflow-hidden border border-zinc-200 dark:border-zinc-800 relative animate-in slide-in-from-bottom-8">
        
        {/* Top Section */}
        <div className="p-8 bg-indigo-600 text-white relative">
           <div className="flex justify-between items-start mb-8">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black">U</div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                 <ShieldCheck className="w-3.5 h-3.5" /> {ticket.status === 'attended' ? 'VERIFIED' : 'ACTIVE'}
              </div>
           </div>
           <h2 className="text-3xl font-black leading-none uppercase tracking-tighter line-clamp-2">{ticket.eventTitle}</h2>
           <p className="text-white/60 text-[10px] font-black mt-3 uppercase tracking-[0.3em]">
             {ticket.type?.replace('_', ' ') || 'STANDARD PASS'} • {ticket.userName}
           </p>
           
           <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-[#FDFBF7] dark:bg-black rounded-full border-r border-zinc-200 dark:border-zinc-800"></div>
           <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#FDFBF7] dark:bg-black rounded-full border-l border-zinc-200 dark:border-zinc-800"></div>
        </div>

        {/* Dashed Separator */}
        <div className="border-t-2 border-dashed border-zinc-100 dark:border-zinc-800 mx-6"></div>

        {/* QR Section */}
        <div className="p-8 flex flex-col items-center">
           <div className="p-5 bg-white rounded-[2.5rem] mb-8 shadow-inner border border-zinc-100">
              <QRCode value={ticket.id} size={180} />
           </div>
           
           <div className="grid grid-cols-2 gap-y-6 gap-x-4 w-full text-left mb-8">
              <div><p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Date</p><p className="font-bold text-sm dark:text-white flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-500"/> {ticket.eventDate}</p></div>
              <div className="text-right"><p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Entry Time</p><p className="font-bold text-sm dark:text-white flex items-center justify-end gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-500"/> {ticket.eventTime || 'TBA'}</p></div>
              <div className="col-span-2 pt-4 border-t border-zinc-50 dark:border-zinc-800"><p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Venue</p><p className="font-bold text-sm dark:text-white flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-500"/> {ticket.eventLocation}</p></div>
              
              {ticket.teamName && (
                <div className="col-span-2 pt-4 border-t border-zinc-50 dark:border-zinc-800 flex justify-between items-center">
                  <div><p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Team</p><p className="font-bold text-sm text-purple-600">{ticket.teamName}</p></div>
                  <div className="text-right"><p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Code</p><p className="font-mono text-xs font-black">{ticket.teamCode}</p></div>
                </div>
              )}
           </div>

           <div className="w-full py-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-center">
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.4em]">PASS-ID: {ticket.id.substring(0,14).toUpperCase()}</p>
           </div>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 flex gap-3">
          <button className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> SAVE PASS
          </button>
          <button onClick={handleShare} className="flex-1 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            {copied ? "COPIED" : "SHARE"}
          </button>
        </div>
      </div>
      
      <div className="mt-8 flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
         <ShieldCheck className="w-4 h-4 text-indigo-600" />
         <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Official Entry Document</p>
      </div>
    </div>
  );
};

export default TicketPage;
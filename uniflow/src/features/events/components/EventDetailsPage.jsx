import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch 
} from 'firebase/firestore'; 
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Calendar, MapPin, Clock, ArrowLeft, Edit, List, 
  ShieldCheck, MessageCircle, Building2, Users, Trash2, Ticket, Share2, ScanLine, AlertTriangle
} from 'lucide-react';

import RegisterModal from './RegisterModal';
import EditEventModal from './EditEventModal';
import EventParticipantsModal from './EventParticipantsModal';

const EventDetailsPage = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [userTicketId, setUserTicketId] = useState(null);
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, 'events', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchEvent();
  }, [id]);

  useEffect(() => {
    const checkStatus = async () => {
      if (user && event) {
        const q = query(collection(db, 'registrations'), where('eventId', '==', event.id), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setIsRegistered(true);
          setUserTicketId(snap.docs[0].id);
        }
      }
    };
    checkStatus();
  }, [user, event]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, url: window.location.href });
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (err) { console.error(err); }
  };

  // 💣 CHUNKED DELETION LOGIC (The "Anti-Crash" Fix)
  const handleDelete = async () => {
    if (!window.confirm("🚨 CRITICAL ACTION: This will purge the event and ALL student passes permanently. This cannot be undone. Proceed?")) return;
    
    try {
      setLoading(true);
      const docsToDelete = [];

      // 1. Collect Tickets
      const qT = query(collection(db, 'registrations'), where('eventId', '==', id));
      const snapshotT = await getDocs(qT);
      snapshotT.docs.forEach(doc => docsToDelete.push(doc.ref));

      // 2. Collect Reviews (Fixing Orphans)
      const qR = query(collection(db, 'reviews'), where('eventId', '==', id));
      const snapshotR = await getDocs(qR);
      snapshotR.docs.forEach(doc => docsToDelete.push(doc.ref));

      // 3. 🛡️ STABILITY PATCH: Chunked Deletion (500 limit)
      for (let i = 0; i < docsToDelete.length; i += 500) {
        const batch = writeBatch(db);
        docsToDelete.slice(i, i + 500).forEach(ref => batch.delete(ref));
        await batch.commit();
      }

      // 4. Delete Event Doc
      await deleteDoc(doc(db, 'events', id));
      
      alert("✅ System Purged Successfully.");
      navigate('/events');
    } catch (error) { 
      console.error(error);
      alert("Failed to delete event data."); 
      setLoading(false); 
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-zinc-200"></div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 animate-pulse">Synchronizing Engine...</p>
    </div>
  );

  if (!event) return <div className="min-h-screen pt-24 text-center">Event not found</div>;

  const isOrganizer = user && (event.organizerId === user.uid || profile?.role === 'super_admin');

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pb-32 transition-colors duration-500">
      
      {/* 📸 CINEMATIC HEADER */}
      <div className="relative h-[55vh] md:h-[65vh] w-full overflow-hidden">
        {!imageError && event.imageUrl ? (
          <img 
            src={event.imageUrl} 
            alt={event.title} 
            className="w-full h-full object-cover scale-105" 
            onError={() => setImageError(true)} 
          />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center p-12 text-center relative">
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
             <h1 className="text-4xl md:text-8xl font-black text-white uppercase tracking-tighter drop-shadow-2xl italic leading-none">{event.title}</h1>
             <p className="text-indigo-400 font-black mt-6 uppercase tracking-[0.4em] text-[10px] bg-white/5 px-6 py-2 rounded-full backdrop-blur-md">Organized by {event.organizerName || 'UniFlow Club'}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] dark:from-black via-transparent to-black/40"></div>
        
        {/* Banner Controls */}
        <div className="absolute top-24 left-6 md:left-12 flex gap-4 z-20">
          <button onClick={() => navigate(-1)} className="p-4 bg-black/20 backdrop-blur-2xl rounded-2xl text-white border border-white/10 hover:bg-white/40 transition-all group">
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
        <button onClick={handleShare} className="absolute top-24 right-6 md:right-12 p-4 bg-black/20 backdrop-blur-2xl rounded-2xl text-white border border-white/10 z-20 active:scale-95 transition-all">
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 -mt-16">
        
        {/* 🛡️ ADMIN QUICK ACTIONS */}
        {isOrganizer && (
          <div className="mb-8 p-8 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl border border-zinc-200 dark:border-zinc-800 rounded-[3rem] shadow-2xl flex flex-wrap items-center justify-between gap-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl shadow-indigo-600/20"><ShieldCheck className="w-6 h-6" /></div>
              <div>
                <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Root Console</h3>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Experience Management Active</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate('/scan')} className="p-4 bg-zinc-50 dark:bg-zinc-800 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm group relative">
                 <ScanLine className="w-5 h-5" />
              </button>
              <button onClick={() => setIsParticipantsOpen(true)} className="p-4 bg-zinc-50 dark:bg-zinc-800 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                 <List className="w-5 h-5" />
              </button>
              <button onClick={() => setIsEditOpen(true)} className="p-4 bg-zinc-50 dark:bg-zinc-800 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                 <Edit className="w-5 h-5" />
              </button>
              <button onClick={handleDelete} className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                 <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* 🍱 BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-10 rounded-[3.5rem] shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Building2 className="w-32 h-32" />
               </div>
               <div className="flex flex-wrap gap-3 mb-8">
                 <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50">{event.category || 'Featured'}</span>
                 {event.type === 'team' && <span className="px-4 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Users className="w-3.5 h-3.5"/> Team Event</span>}
                 {event.allowedBranches === 'CSE/AI Only' && <span className="px-4 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5"/> CSE Restricted</span>}
               </div>
               <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-[0.9] uppercase italic">{event.title}</h1>
               <div className="prose prose-zinc dark:prose-invert max-w-none">
                  <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed whitespace-pre-line text-lg md:text-xl">
                    {event.description}
                  </p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] flex items-center gap-6 shadow-sm">
                <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-3xl"><Calendar className="w-8 h-8"/></div>
                <div>
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Experience Date</p>
                   <p className="text-xl font-black dark:text-white leading-tight">{event.date}</p>
                   <p className="text-xs font-bold text-zinc-500 mt-1 uppercase flex items-center gap-2"><Clock className="w-3 h-3"/> {event.time}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] flex items-center gap-6 shadow-sm">
                <div className="p-5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-3xl"><MapPin className="w-8 h-8"/></div>
                <div className="overflow-hidden">
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Campus Venue</p>
                   <p className="text-xl font-black dark:text-white leading-tight uppercase truncate">{event.location}</p>
                   <p className="text-xs font-bold text-indigo-600 mt-1 uppercase tracking-tighter">Verified Location</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 dark:bg-white text-white dark:text-black p-10 rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] sticky top-24 space-y-10 border border-white/5">
               <div className="text-center">
                  <p className="text-[10px] font-black uppercase opacity-50 tracking-[0.3em] mb-4">Official Entry Pass</p>
                  <div className="flex items-center justify-center gap-2">
                     <p className="text-7xl font-black tracking-tighter">{event.price > 0 ? `₹${event.price}` : 'FREE'}</p>
                  </div>
               </div>

               <div className="space-y-4">
                 {isRegistered ? (
                   <button onClick={() => navigate(`/tickets/${userTicketId}`)} className="w-full py-6 bg-indigo-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all">
                     <Ticket className="w-5 h-5" /> View Your Pass
                   </button>
                 ) : (
                   <button 
                     onClick={() => setIsRegisterOpen(true)}
                     disabled={event.ticketsSold >= event.totalTickets}
                     className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl shadow-indigo-600/30 ${
                       event.ticketsSold >= event.totalTickets 
                       ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                       : 'bg-indigo-600 text-white hover:scale-105 active:scale-95'
                     }`}
                   >
                     {event.ticketsSold >= event.totalTickets ? 'Sold Out' : 'Claim Pass'}
                   </button>
                 )}
               </div>

               <div className="pt-8 border-t border-white/10 dark:border-black/10">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase opacity-50 mb-4 tracking-widest">
                     <span>Passes Claimed</span>
                     <span>{event.ticketsSold} / {event.totalTickets}</span>
                  </div>
                  <div className="w-full h-4 bg-white/10 dark:bg-black/10 rounded-full overflow-hidden p-1">
                     <div className="h-full bg-white dark:bg-zinc-900 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: `${(event.ticketsSold / event.totalTickets) * 100}%` }}></div>
                  </div>
               </div>

               {event.whatsappLink && (
                 <a href={event.whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-green-500 hover:text-green-400 py-2 border-2 border-green-500/20 rounded-2xl transition-all">
                    <MessageCircle className="w-4 h-4" /> Join Vibe Group
                 </a>
               )}
            </div>
          </div>

        </div>
      </div>

      {/* MODALS */}
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} event={event} />
      
      {isOrganizer && (
        <>
          <EditEventModal 
            isOpen={isEditOpen} 
            onClose={() => setIsEditOpen(false)} 
            event={event} 
            onSuccess={() => {
               // Soft reload
               const fetchUpdate = async () => {
                 const snap = await getDoc(doc(db, 'events', id));
                 setEvent({ id: snap.id, ...snap.data() });
               };
               fetchUpdate();
            }} 
          />
          <EventParticipantsModal isOpen={isParticipantsOpen} onClose={() => setIsParticipantsOpen(false)} event={event} />
        </>
      )}
    </div>
  );
};

export default EventDetailsPage;
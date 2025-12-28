import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch 
} from 'firebase/firestore'; 
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Calendar, MapPin, Clock, ArrowLeft, Edit, List, 
  ShieldCheck, MessageCircle, Building2, Users, Trash2, Ticket, Share2, ScanLine 
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
        alert("Link copied!");
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!window.confirm("CRITICAL: Delete event and all data?")) return;
    try {
      setLoading(true);
      const batch = writeBatch(db);
      const q = query(collection(db, 'registrations'), where('eventId', '==', id));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      await deleteDoc(doc(db, 'events', id));
      navigate('/events');
    } catch (error) { alert("Failed"); setLoading(false); }
  };

  if (loading) return <div className="min-h-screen pt-24 text-center text-zinc-500 font-bold">UniFlow...</div>;
  if (!event) return <div className="min-h-screen pt-24 text-center">Event not found</div>;

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isOrganizer = user && (event.organizerId === user.uid || profile?.role === 'super_admin');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-32 transition-colors duration-500">
      
      {/* 📸 FULL-WIDTH BANNER */}
      <div className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
        {!imageError && event.imageUrl ? (
          <img 
            src={event.imageUrl} 
            alt={event.title} 
            className="w-full h-full object-cover" 
            onError={() => setImageError(true)} 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col items-center justify-center p-8 text-center">
             <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">{event.title}</h1>
             <p className="text-white/70 font-bold mt-4 uppercase tracking-widest text-xs">Organized by {event.organizerName || 'UniFlow Club'}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-black via-transparent to-black/30"></div>
        
        {/* Banner Controls */}
        <div className="absolute top-24 left-6 flex gap-4 z-20">
          <button onClick={() => navigate(-1)} className="p-3 bg-white/20 backdrop-blur-xl rounded-full text-white border border-white/10 hover:bg-white/40 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>
        <button onClick={handleShare} className="absolute top-24 right-6 p-3 bg-white/20 backdrop-blur-xl rounded-full text-white border border-white/10 z-20">
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 -mt-10">
        
        {/* 🛡️ ADMIN QUICK ACTIONS */}
        {isOrganizer && (
          <div className="mb-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl"><ShieldCheck className="w-6 h-6" /></div>
              <div><h3 className="font-bold text-zinc-900 dark:text-white">Organizer Console</h3><p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Active Permissions</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate('/scan')} className="p-3 bg-zinc-50 dark:bg-zinc-800 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><ScanLine className="w-5 h-5" /></button>
              <button onClick={() => setIsParticipantsOpen(true)} className="p-3 bg-zinc-50 dark:bg-zinc-800 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><List className="w-5 h-5" /></button>
              <button onClick={() => setIsEditOpen(true)} className="p-3 bg-zinc-50 dark:bg-zinc-800 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Edit className="w-5 h-5" /></button>
              <button onClick={handleDelete} className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        )}

        {/* 🍱 BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm">
               <div className="flex flex-wrap gap-2 mb-6">
                 <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{event.category || 'Featured'}</span>
                 {event.type === 'team' && <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Users className="w-3 h-3"/> Team</span>}
               </div>
               <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter leading-none">{event.title}</h1>
               <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed whitespace-pre-line text-lg">{event.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] flex items-center gap-4">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><Calendar className="w-6 h-6"/></div>
                <div><p className="text-[10px] font-black text-zinc-400 uppercase">Schedule</p><p className="font-bold">{event.date} • {event.time}</p></div>
              </div>
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] flex items-center gap-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-2xl"><MapPin className="w-6 h-6"/></div>
                <div><p className="text-[10px] font-black text-zinc-400 uppercase">Venue</p><p className="font-bold line-clamp-1">{event.location}</p></div>
              </div>
            </div>
          </div>

          {/* Registration Sidebar (Sticky on Desktop) */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 dark:bg-white text-white dark:text-black p-8 rounded-[2.5rem] shadow-2xl sticky top-24 space-y-6">
               <div>
                  <p className="text-[10px] font-black uppercase opacity-50 tracking-widest mb-1">Entry Price</p>
                  <p className="text-4xl font-black">{event.price > 0 ? `₹${event.price}` : 'FREE'}</p>
               </div>

               {isRegistered ? (
                 <button onClick={() => navigate(`/tickets/${userTicketId}`)} className="w-full py-4 bg-green-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2">
                   <Ticket className="w-5 h-5" /> View Ticket
                 </button>
               ) : (
                 <button 
                   onClick={() => setIsRegisterOpen(true)}
                   disabled={event.ticketsSold >= event.totalTickets}
                   className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:scale-105 transition-transform disabled:bg-zinc-700"
                 >
                   {event.ticketsSold >= event.totalTickets ? 'Sold Out' : 'Register Now'}
                 </button>
               )}

               <div>
                  <div className="flex justify-between text-[10px] font-black uppercase opacity-50 mb-2">
                     <span>Live Attendance</span>
                     <span>{event.ticketsSold} / {event.totalTickets}</span>
                  </div>
                  <div className="w-full h-3 bg-white/10 dark:bg-black/10 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-500 animate-pulse" style={{ width: `${(event.ticketsSold / event.totalTickets) * 100}%` }}></div>
                  </div>
               </div>

               {event.whatsappLink && (
                 <a href={event.whatsappLink} target="_blank" className="flex items-center gap-2 text-xs font-bold text-green-500 hover:underline pt-4 border-t border-white/10 dark:border-black/10">
                    <MessageCircle className="w-4 h-4" /> Join Official Group
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
          <EditEventModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} event={event} onSuccess={() => window.location.reload()} />
          <EventParticipantsModal isOpen={isParticipantsOpen} onClose={() => setIsParticipantsOpen(false)} event={event} />
        </>
      )}
    </div>
  );
};

export default EventDetailsPage;
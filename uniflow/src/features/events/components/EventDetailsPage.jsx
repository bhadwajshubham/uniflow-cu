import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch 
} from 'firebase/firestore'; 
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Calendar, MapPin, Clock, ArrowLeft, Edit, List, 
  ShieldCheck, MessageCircle, Building2, Users, Trash2, Ticket, Share2 
} from 'lucide-react';

import RegisterModal from './RegisterModal';
import EditEventModal from './EditEventModal';
import EventParticipantsModal from './EventParticipantsModal';

const EventDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Registration State
  const [isRegistered, setIsRegistered] = useState(false);
  const [userTicketId, setUserTicketId] = useState(null);
  
  // Modal States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  // 1. Fetch Event
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, 'events', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  // 2. Check Registration Status
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

  // 📢 NATIVE SHARE LOGIC
  const handleShare = async () => {
    const shareData = {
      title: event.title,
      text: `Join ${event.title} organized by ${event.organizerName || 'UniFlow Club'}!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Event link copied to clipboard!");
      }
    } catch (err) { console.error("Share failed", err); }
  };

  // 🗑️ CLEAN DELETE LOGIC (Batch)
  const handleDelete = async () => {
    if (!window.confirm("CRITICAL: This will delete the event AND all associated data.")) return;
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    try {
      setLoading(true);
      const batch = writeBatch(db);

      // Delete Tickets
      const q = query(collection(db, 'registrations'), where('eventId', '==', id));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Delete Reviews
      const qReviews = query(collection(db, 'reviews'), where('eventId', '==', id));
      const snapReviews = await getDocs(qReviews);
      snapReviews.docs.forEach(doc => batch.delete(doc.ref));

      await batch.commit();
      await deleteDoc(doc(db, 'events', id));
      
      alert("Event and all data deleted.");
      navigate('/events');
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete event.");
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen pt-24 text-center bg-[#FDFBF7] dark:bg-black text-zinc-500 font-bold">Loading Event Details...</div>;
  if (!event) return <div className="min-h-screen pt-24 text-center bg-[#FDFBF7] dark:bg-black">Event not found</div>;

  const isOrganizer = user && event.organizerId === user.uid;

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pb-24 transition-colors duration-500">
      
      {/* 🖼️ BANNER SECTION (Full Width + Fallback Logic) */}
      <div className="h-64 md:h-[450px] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative flex items-center justify-center p-6 text-center">
        {!imageError && event.imageUrl ? (
          <img 
            src={event.imageUrl} 
            alt={event.title} 
            className="absolute inset-0 w-full h-full object-cover z-0" 
            onError={() => setImageError(true)} 
          />
        ) : null}

        {/* 🎨 Fallback Text (Hidden if image loads, visible if missing/broken) */}
        <div className="relative z-10 animate-in fade-in zoom-in duration-700">
           <h1 className="text-4xl md:text-7xl font-black text-white drop-shadow-2xl uppercase tracking-tighter">
             {event.title}
           </h1>
           <p className="text-white/80 font-bold mt-4 uppercase tracking-widest text-xs md:text-sm">
             Organized by {event.organizerName || 'UniFlow Club'}
           </p>
        </div>

        {/* Action Badges over Banner */}
        <div className="absolute top-24 left-6 z-20 flex items-center gap-3">
            <button onClick={() => navigate('/events')} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
                <ArrowLeft className="w-5 h-5" />
            </button>
        </div>
        
        <div className="absolute top-24 right-6 z-20">
           <div className="bg-white/90 dark:bg-black/90 backdrop-blur px-5 py-2 rounded-2xl text-sm font-black border border-zinc-200/50 shadow-xl">
             {event.price > 0 ? `₹${event.price}` : 'FREE ENTRY'}
           </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-30">
        
        {/* 🛡️ ADMIN PANEL (Floating Above Card) */}
        {isOrganizer && (
          <div className="mb-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-xl animate-in slide-in-from-top-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20"><ShieldCheck className="w-6 h-6" /></div>
                <div><h3 className="font-bold text-zinc-900 dark:text-white text-lg leading-none">Admin Controls</h3><p className="text-xs text-zinc-500 mt-1 uppercase font-black">Event Management Mode</p></div>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center md:justify-end">
                <button onClick={() => setIsParticipantsOpen(true)} className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 flex items-center gap-2 transition-all"><List className="w-4 h-4" /> Participants</button>
                <button onClick={() => setIsEditOpen(true)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all"><Edit className="w-4 h-4" /> Edit</button>
                <button onClick={handleDelete} className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-zinc-200/50 dark:border-zinc-800 shadow-2xl p-8 md:p-12">
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* LEFT: MAIN CONTENT */}
            <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-widest">{event.category || 'Event'}</span>
                  {event.allowedBranches && event.allowedBranches !== 'All' && <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1"><Building2 className="w-3 h-3" /> {event.allowedBranches}</span>}
                  {event.type === 'team' && <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1"><Users className="w-3 h-3" /> Team Event</span>}
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-6 leading-tight tracking-tight">{event.title}</h1>
                <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-line text-lg mb-10 leading-relaxed font-medium">{event.description}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                    <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl shadow-sm"><Calendar className="w-5 h-5 text-indigo-600"/></div>
                        <div><p className="text-[10px] font-black text-zinc-400 uppercase">Date</p><p className="font-bold text-zinc-900 dark:text-white">{event.date}</p></div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl shadow-sm"><Clock className="w-5 h-5 text-indigo-600"/></div>
                        <div><p className="text-[10px] font-black text-zinc-400 uppercase">Time</p><p className="font-bold text-zinc-900 dark:text-white">{event.time}</p></div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 col-span-full">
                        <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl shadow-sm"><MapPin className="w-5 h-5 text-indigo-600"/></div>
                        <div><p className="text-[10px] font-black text-zinc-400 uppercase">Location</p><p className="font-bold text-zinc-900 dark:text-white">{event.location}</p></div>
                    </div>
                </div>

                {event.whatsappLink && (
                  <a href={event.whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-2xl text-green-700 dark:text-green-400 font-bold hover:bg-green-100 transition-all">
                    <MessageCircle className="w-6 h-6" /> Join Official WhatsApp Group
                  </a>
                )}
            </div>

            {/* RIGHT: ACTION CARD */}
            <div className="w-full lg:w-96">
                <div className="p-8 bg-[#F8F9FA] dark:bg-zinc-800/30 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 sticky top-28 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <div><p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Pricing</p><p className="text-3xl font-black text-zinc-900 dark:text-white">{event.price > 0 ? `₹${event.price}` : 'FREE'}</p></div>
                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm"><Ticket className="w-6 h-6 text-indigo-600" /></div>
                  </div>

                  {/* REGISTRATION LOGIC */}
                  {isRegistered ? (
                      <button 
                        onClick={() => navigate(`/tickets/${userTicketId}`)} 
                        className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-green-500/20 active:scale-95 text-lg flex items-center justify-center gap-2"
                      >
                        <Ticket className="w-5 h-5" /> View Your Ticket
                      </button>
                  ) : (
                      <button 
                        onClick={() => setIsRegisterOpen(true)}
                        disabled={event.ticketsSold >= event.totalTickets}
                        className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-black rounded-2xl transition-all shadow-xl shadow-zinc-900/20 active:scale-95 text-lg disabled:bg-zinc-300 disabled:shadow-none"
                      >
                        {event.ticketsSold >= event.totalTickets ? 'SOLD OUT' : (event.price > 0 ? 'Buy Ticket' : 'Claim Spot')}
                      </button>
                  )}

                  <button 
                    onClick={handleShare}
                    className="w-full mt-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold rounded-2xl hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" /> Share Event
                  </button>
                  
                  <div className="mt-8">
                    <div className="flex justify-between text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                       <span>Live Capacity</span>
                       <span>{event.ticketsSold} / {event.totalTickets} Filled</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min((event.ticketsSold / event.totalTickets) * 100, 100)}%` }}></div>
                    </div>
                    <p className="mt-3 text-[10px] text-center text-zinc-400 font-medium">Verified by UniFlow Cloud</p>
                  </div>
                </div>
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
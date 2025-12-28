import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch 
} from 'firebase/firestore'; 
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Calendar, MapPin, Clock, ArrowLeft, Edit, List, 
  ShieldCheck, MessageCircle, Building2, Users, Trash2, Ticket, Share2, ScanLine, X, Shield 
} from 'lucide-react';

import RegisterModal from './RegisterModal';
import EditEventModal from './EditEventModal';
import EventParticipantsModal from './EventParticipantsModal';

const EventDetailsPage = () => {
  const { id } = useParams();
  const { user, profile } = useAuth(); // Profile included for role check
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Registration State
  const [isRegistered, setIsRegistered] = useState(false);
  const [userTicketId, setUserTicketId] = useState(null);
  
  // Modal & Menu States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

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

  // 📢 Share Logic
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
        alert("Link copied to clipboard!");
      }
    } catch (err) { console.error(err); }
  };

  // 🗑️ Delete Logic
  const handleDelete = async () => {
    if (!window.confirm("CRITICAL: Delete event and all associated tickets?")) return;
    try {
      setLoading(true);
      const batch = writeBatch(db);
      const q = query(collection(db, 'registrations'), where('eventId', '==', id));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      await deleteDoc(doc(db, 'events', id));
      navigate('/events');
    } catch (error) {
      alert("Delete failed.");
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0f0f10] flex items-center justify-center font-black text-indigo-600">UNIFLOW</div>;
  if (!event) return <div className="min-h-screen pt-24 text-center">Event not found</div>;

  // 🛡️ Admin Check Logic
  const isOrganizer = user && (event.organizerId === user.uid || profile?.role === 'super_admin');

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0f0f10] text-zinc-900 dark:text-zinc-100 transition-colors duration-500">
      
      {/* 📸 HYPE HERO SECTION */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-600 to-purple-800">
          {!imageError && event.imageUrl ? (
            <img 
              src={event.imageUrl} 
              className="w-full h-full object-cover" 
              alt="" 
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
               <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">
                 {event.title}
               </h1>
               <p className="text-white/70 font-bold mt-4 uppercase tracking-widest text-sm">
                 Organized by {event.organizerName || 'UniFlow Club'}
               </p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] dark:from-[#0f0f10] via-transparent to-black/30"></div>
        </div>

        {/* Floating Top Nav */}
        <div className="absolute top-20 left-0 w-full px-6 flex justify-between items-center z-20">
          <button onClick={() => navigate('/events')} className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/10 hover:bg-white/20 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button onClick={handleShare} className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/10 hover:bg-white/20 transition-all">
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 🍱 BENTO CONTENT LAYOUT */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-xl">
             <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">{event.category || 'Featured'}</span>
                {event.type === 'team' && <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Users className="w-3 h-3"/> Team</span>}
                {event.allowedBranches && event.allowedBranches !== 'All' && <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Building2 className="w-3 h-3"/> {event.allowedBranches}</span>}
             </div>
             <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-none">{event.title}</h2>
             <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
               {event.description}
             </p>
          </div>

          {/* Location & Time Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800 p-6 rounded-[2rem] flex items-center gap-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl"><Calendar className="w-6 h-6"/></div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Schedule</p>
                <p className="font-bold text-sm md:text-base">{event.date} • {event.time}</p>
              </div>
            </div>
            <div className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800 p-6 rounded-[2rem] flex items-center gap-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl"><MapPin className="w-6 h-6"/></div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Location</p>
                <p className="font-bold text-sm md:text-base line-clamp-1">{event.location}</p>
              </div>
            </div>
          </div>

          {event.whatsappLink && (
            <a href={event.whatsappLink} target="_blank" className="block p-6 bg-green-500 text-white rounded-[2rem] font-black text-xl flex items-center justify-between group overflow-hidden">
               <div className="flex items-center gap-4">
                  <MessageCircle className="w-8 h-8" /> <span>Join Official Group</span>
               </div>
               <ArrowLeft className="w-6 h-6 rotate-180 group-hover:translate-x-2 transition-transform" />
            </a>
          )}
        </div>

        {/* Sidebar: Social Proof */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 dark:bg-white text-white dark:text-black p-8 rounded-[2.5rem] shadow-2xl sticky top-24">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-6">Live Attendance</h3>
             <div className="flex -space-x-3 mb-8">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-zinc-900 dark:border-white bg-zinc-800 dark:bg-zinc-100 flex items-center justify-center font-bold text-xs">U</div>
                ))}
                <div className="w-12 h-12 rounded-full border-4 border-zinc-900 dark:border-white bg-indigo-600 flex items-center justify-center font-black text-xs text-white">
                  +{event.ticketsSold}
                </div>
             </div>
             <p className="text-2xl font-black mb-2 tracking-tight">Don't miss out.</p>
             <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase opacity-60">
                   <span>Capacity</span>
                   <span>{event.ticketsSold} / {event.totalTickets}</span>
                </div>
                <div className="w-full h-3 bg-white/10 dark:bg-black/10 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-indigo-500 animate-pulse transition-all duration-1000" 
                     style={{ width: `${(event.ticketsSold / event.totalTickets) * 100}%` }}
                   ></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* 📱 THUMB-ZONE STICKY ACTION BAR */}
      <div className="fixed bottom-0 left-0 w-full p-6 z-[40]">
        <div className="max-w-2xl mx-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200/50 dark:border-zinc-800 p-4 rounded-[2rem] shadow-2xl flex items-center justify-between">
           <div className="px-4">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Entry Fee</p>
              <p className="text-2xl font-black">{event.price > 0 ? `₹${event.price}` : 'FREE'}</p>
           </div>
           
           {isRegistered ? (
              <button 
                onClick={() => navigate(`/tickets/${userTicketId}`)}
                className="px-8 py-4 bg-green-500 text-white rounded-2xl font-black text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-green-500/20"
              >
                <Ticket className="w-5 h-5" /> View Ticket
              </button>
           ) : (
              <button 
                onClick={() => setIsRegisterOpen(true)}
                disabled={event.ticketsSold >= event.totalTickets}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
              >
                {event.ticketsSold >= event.totalTickets ? 'Sold Out' : 'Get My Spot'}
              </button>
           )}
        </div>
      </div>

      {/* 🛡️ ADMIN FAB (FLOATING ACTION BUTTON) */}
      {isOrganizer && (
        <div className="fixed bottom-32 right-6 z-[50] flex flex-col items-end gap-3">
          {isAdminMenuOpen && (
            <div className="flex flex-col gap-3 mb-3 animate-in slide-in-from-bottom-5">
              <button 
                onClick={() => navigate('/scan')}
                className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-black shadow-2xl hover:bg-indigo-600 hover:text-white transition-all group"
              >
                 <ScanLine className="w-6 h-6 text-indigo-500 group-hover:text-white" /> <span>Scanner</span>
              </button>
              <button onClick={() => setIsParticipantsOpen(true)} className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-black shadow-2xl hover:bg-indigo-600 hover:text-white transition-all group">
                 <List className="w-6 h-6 text-indigo-500 group-hover:text-white" /> <span>Manage</span>
              </button>
              <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-black shadow-2xl hover:bg-indigo-600 hover:text-white transition-all group">
                 <Edit className="w-6 h-6 text-indigo-500 group-hover:text-white" /> <span>Edit Event</span>
              </button>
              <button onClick={handleDelete} className="flex items-center gap-3 px-6 py-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl font-black shadow-2xl text-red-600 hover:bg-red-600 hover:text-white transition-all">
                 <Trash2 className="w-6 h-6" /> <span>Delete</span>
              </button>
            </div>
          )}
          <button 
            onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
            className={`p-5 rounded-full shadow-2xl transition-all duration-500 transform ${isAdminMenuOpen ? 'bg-zinc-900 dark:bg-white text-white dark:text-black rotate-90' : 'bg-indigo-600 text-white'}`}
          >
            {isAdminMenuOpen ? <X className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
          </button>
        </div>
      )}

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
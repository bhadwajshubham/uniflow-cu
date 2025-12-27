import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch 
} from 'firebase/firestore'; // 👈 Added Batch imports
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Calendar, MapPin, Clock, ArrowLeft, Edit, List, 
  ShieldCheck, AlertCircle, MessageCircle, Building2, Users, Trash2 
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
  
  // Modal States
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
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  // 🗑️ NEW: BATCH DELETE LOGIC (Clean Up)
  const handleDelete = async () => {
    if (!window.confirm("CRITICAL: This will delete the event and ALL associated tickets. This cannot be undone.")) return;
    
    try {
      setLoading(true);
      // 1. Delete all associated registrations (Tickets)
      const q = query(collection(db, 'registrations'), where('eventId', '==', id));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      // 2. Delete the Event Document
      await deleteDoc(doc(db, 'events', id));
      
      alert("Event and all tickets deleted.");
      navigate('/events');
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete event.");
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen pt-24 text-center text-zinc-500">Loading...</div>;
  
  if (!event) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center">
      <AlertCircle className="w-12 h-12 text-zinc-300 mb-4" />
      <h2 className="text-xl font-bold">Event not found</h2>
      <button onClick={() => navigate('/events')} className="text-indigo-600 mt-4 hover:underline">Back to Events</button>
    </div>
  );

  // 🔒 STRICT OWNERSHIP CHECK
  const isOrganizer = user && event.organizerId === user.uid;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation */}
        <button onClick={() => navigate('/events')} className="flex items-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
        </button>

        {/* 🛡️ ADMIN PANEL (Only Visible to Organizer) */}
        {isOrganizer && (
          <div className="mb-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-3xl animate-in slide-in-from-top-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900 dark:text-white text-lg">Admin Controls</h3>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">You are the organizer.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 w-full md:w-auto justify-center md:justify-end">
                <button 
                  onClick={() => setIsParticipantsOpen(true)}
                  className="px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <List className="w-5 h-5 text-indigo-500" /> Manage
                </button>
                <button 
                  onClick={() => setIsEditOpen(true)}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Edit className="w-5 h-5" /> Edit
                </button>
                {/* 🗑️ DELETE BUTTON */}
                <button 
                  onClick={handleDelete}
                  className="px-5 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          {/* Image */}
          <div className="h-64 md:h-[400px] bg-zinc-100 dark:bg-zinc-800 relative">
            {!imageError && event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" onError={() => setImageError(true)} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <Calendar className="w-20 h-20 text-white/50" />
              </div>
            )}
             <div className="absolute top-6 right-6 flex gap-2">
               <div className="bg-white/90 dark:bg-black/90 backdrop-blur px-4 py-2 rounded-full text-sm font-bold border border-zinc-200 dark:border-zinc-700 shadow-sm">
                {event.price > 0 ? `$${event.price}` : 'Free Entry'}
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-12 justify-between">
              
              {/* Left Column: Details */}
              <div className="flex-1">
                 {/* Tags */}
                 <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {event.category || 'Event'}
                  </span>
                  {event.allowedBranches && event.allowedBranches !== 'All' && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {event.allowedBranches} Only
                    </span>
                  )}
                  {event.type === 'team' && (
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3" /> Team Event
                    </span>
                  )}
                </div>

                 <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-6">{event.title}</h1>
                 <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-line text-lg mb-8 leading-relaxed">
                   {event.description}
                 </p>
                 
                 <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-indigo-500"/>
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-indigo-500"/>
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">{event.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-indigo-500"/>
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">{event.location}</span>
                    </div>
                 </div>

                 {/* WhatsApp Link */}
                 {event.whatsappLink && (
                  <a href={event.whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-green-600 font-bold hover:underline mb-8">
                    <MessageCircle className="w-5 h-5" /> Join WhatsApp Group
                  </a>
                 )}
              </div>

              {/* Right Column: Registration Card */}
              <div className="w-full md:w-80">
                 <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-200 dark:border-zinc-700 sticky top-24">
                    <button 
                      onClick={() => setIsRegisterOpen(true)}
                      disabled={event.ticketsSold >= event.totalTickets}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 text-lg"
                    >
                      {event.ticketsSold >= event.totalTickets ? 'Sold Out' : 'Register Now'}
                    </button>
                    
                    <div className="mt-4 flex justify-between text-xs text-zinc-500 font-medium uppercase tracking-wide">
                      <span>Capacity</span>
                      <span>{event.ticketsSold}/{event.totalTickets} Filled</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-2 overflow-hidden">
                       <div 
                         className="h-full bg-indigo-500 transition-all duration-500" 
                         style={{ width: `${Math.min((event.ticketsSold / event.totalTickets) * 100, 100)}%` }}
                       ></div>
                    </div>
                 </div>
              </div>

            </div>
          </div>
        </div>

        {/* MODAL MOUNTS */}
        <RegisterModal 
          isOpen={isRegisterOpen} 
          onClose={() => setIsRegisterOpen(false)} 
          event={event} 
        />
        
        {/* Only mount admin modals if user is organizer */}
        {isOrganizer && (
          <>
            <EditEventModal 
              isOpen={isEditOpen} 
              onClose={() => setIsEditOpen(false)} 
              event={event} 
              onSuccess={() => window.location.reload()} 
            />
            <EventParticipantsModal 
              isOpen={isParticipantsOpen} 
              onClose={() => setIsParticipantsOpen(false)} 
              event={event} 
            />
          </>
        )}

      </div>
    </div>
  );
};

export default EventDetailsPage;
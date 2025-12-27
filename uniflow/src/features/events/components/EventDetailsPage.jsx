import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch 
} from 'firebase/firestore'; 
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Calendar, MapPin, Clock, ArrowLeft, Edit, List, 
  ShieldCheck, AlertCircle, MessageCircle, Building2, Users, Trash2, Ticket 
} from 'lucide-react'; // Added Ticket icon

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

  // 🗑️ CLEAN DELETE LOGIC
  const handleDelete = async () => {
    if (!window.confirm("CRITICAL: This will delete the event AND all associated data.")) return;
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
      
      alert("Event deleted.");
      navigate('/events');
    } catch (error) {
      alert("Failed to delete.");
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen pt-24 text-center text-zinc-500">Loading...</div>;
  if (!event) return <div className="min-h-screen pt-24 text-center">Event not found</div>;

  const isOrganizer = user && event.organizerId === user.uid;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        
        <button onClick={() => navigate('/events')} className="flex items-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
        </button>

        {/* 🛡️ ADMIN PANEL */}
        {isOrganizer && (
          <div className="mb-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-3xl animate-in slide-in-from-top-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20"><ShieldCheck className="w-6 h-6" /></div>
                <div><h3 className="font-bold text-indigo-900 dark:text-white text-lg">Admin Controls</h3><p className="text-sm text-indigo-700 dark:text-indigo-300">Organizer Mode</p></div>
              </div>
              <div className="flex flex-wrap gap-3 w-full md:w-auto justify-center md:justify-end">
                <button onClick={() => setIsParticipantsOpen(true)} className="px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center justify-center gap-2 transition-all shadow-sm"><List className="w-5 h-5 text-indigo-500" /> Manage</button>
                <button onClick={() => setIsEditOpen(true)} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"><Edit className="w-5 h-5" /> Edit</button>
                <button onClick={handleDelete} className="px-5 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <div className="h-64 md:h-[400px] bg-zinc-100 dark:bg-zinc-800 relative">
            {!imageError && event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" onError={() => setImageError(true)} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center"><Calendar className="w-20 h-20 text-white/50" /></div>
            )}
             <div className="absolute top-6 right-6 flex gap-2">
               <div className="bg-white/90 dark:bg-black/90 backdrop-blur px-4 py-2 rounded-full text-sm font-bold border border-zinc-200 dark:border-zinc-700 shadow-sm">{event.price > 0 ? `$${event.price}` : 'Free Entry'}</div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-12 justify-between">
              <div className="flex-1">
                 <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-wider">{event.category || 'Event'}</span>
                  {event.allowedBranches && event.allowedBranches !== 'All' && <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Building2 className="w-3 h-3" /> {event.allowedBranches} Only</span>}
                  {event.type === 'team' && <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Users className="w-3 h-3" /> Team Event</span>}
                </div>
                 <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-6">{event.title}</h1>
                 <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-line text-lg mb-8 leading-relaxed">{event.description}</p>
                 <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-indigo-500"/><span className="text-zinc-700 dark:text-zinc-300 font-medium">{event.date}</span></div>
                    <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-indigo-500"/><span className="text-zinc-700 dark:text-zinc-300 font-medium">{event.time}</span></div>
                    <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-indigo-500"/><span className="text-zinc-700 dark:text-zinc-300 font-medium">{event.location}</span></div>
                 </div>
                 {event.whatsappLink && <a href={event.whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-green-600 font-bold hover:underline mb-8"><MessageCircle className="w-5 h-5" /> Join WhatsApp Group</a>}
              </div>

              <div className="w-full md:w-80">
                 <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-200 dark:border-zinc-700 sticky top-24">
                    {/* BUTTON LOGIC: View Ticket vs Register */}
                    {isRegistered ? (
                       <button 
                         onClick={() => navigate(`/tickets/${userTicketId}`)} 
                         className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-xl shadow-green-500/20 active:scale-95 text-lg flex items-center justify-center gap-2"
                       >
                         <Ticket className="w-5 h-5" /> View Your Ticket
                       </button>
                    ) : (
                       <button 
                         onClick={() => setIsRegisterOpen(true)}
                         disabled={event.ticketsSold >= event.totalTickets}
                         className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 text-lg"
                       >
                         {event.ticketsSold >= event.totalTickets ? 'Sold Out' : 'Register Now'}
                       </button>
                    )}
                    
                    <div className="mt-4 flex justify-between text-xs text-zinc-500 font-medium uppercase tracking-wide"><span>Capacity</span><span>{event.ticketsSold}/{event.totalTickets} Filled</span></div>
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-2 overflow-hidden">
                       <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${Math.min((event.ticketsSold / event.totalTickets) * 100, 100)}%` }}></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} event={event} />
        {isOrganizer && (
          <>
            <EditEventModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} event={event} onSuccess={() => window.location.reload()} />
            <EventParticipantsModal isOpen={isParticipantsOpen} onClose={() => setIsParticipantsOpen(false)} event={event} />
          </>
        )}
      </div>
    </div>
  );
};

export default EventDetailsPage;
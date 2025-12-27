import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Calendar, MapPin, Clock, ArrowLeft, Edit, List, ShieldCheck, 
  AlertCircle, MessageCircle, Building2, Users, Share2, Ticket 
} from 'lucide-react';

// 👇 IMPORT MODALS
import RegisterModal from './RegisterModal';
import EditEventModal from './EditEventModal';
import EventParticipantsModal from './EventParticipantsModal';

const EventDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Data State
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // User Status State
  const [isRegistered, setIsRegistered] = useState(false);
  const [userTicketId, setUserTicketId] = useState(null);
  
  // Modal States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  // 1. Fetch Event Data
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

  // 2. Check if User is Already Registered
  useEffect(() => {
    const checkRegistration = async () => {
      if (!user || !event) return;
      try {
        const q = query(
          collection(db, 'registrations'), 
          where('eventId', '==', event.id), 
          where('userId', '==', user.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setIsRegistered(true);
          setUserTicketId(snap.docs[0].id); // Save Ticket ID for navigation
        }
      } catch (err) {
        console.error("Registration check failed:", err);
      }
    };
    checkRegistration();
  }, [user, event]);

  // 3. Share Handler
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out ${event.title} on UniFlow!`,
          url: window.location.href,
        });
      } catch (err) { console.log("Share cancelled"); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!"); 
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
        
        {/* Navigation & Share */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/events')} className="flex items-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
          </button>
          <button onClick={handleShare} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <Share2 className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
          </button>
        </div>

        {/* 🛡️ ADMIN PANEL (Only Visible to Organizer) */}
        {isOrganizer && (
          <div className="mb-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-3xl animate-in slide-in-from-top-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900 dark:text-white text-lg">Admin Controls</h3>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">Manage this event.</p>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setIsParticipantsOpen(true)}
                  className="flex-1 sm:flex-none px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center justify-center gap-2 transition-all"
                >
                  <List className="w-5 h-5 text-indigo-500" /> Participants
                </button>
                <button 
                  onClick={() => setIsEditOpen(true)}
                  className="flex-1 sm:flex-none px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  <Edit className="w-5 h-5" /> Edit Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          
          {/* Image Section */}
          <div className="h-64 md:h-[400px] bg-zinc-100 dark:bg-zinc-800 relative">
            {!imageError && event.imageUrl ? (
              <img 
                src={event.imageUrl} 
                alt={event.title} 
                className="w-full h-full object-cover" 
                onError={() => setImageError(true)} 
              />
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

                 <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
                   {event.title}
                 </h1>
                 
                 <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-line text-lg mb-8 leading-relaxed">
                   {event.description}
                 </p>
                 
                 {/* Info Rows */}
                 <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 w-full sm:w-fit">
                      <Calendar className="w-5 h-5 text-indigo-500"/>
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase">Date</p>
                        <span className="text-zinc-900 dark:text-white font-medium">{new Date(event.date).toDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 w-full sm:w-fit">
                      <Clock className="w-5 h-5 text-indigo-500"/>
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase">Time</p>
                        <span className="text-zinc-900 dark:text-white font-medium">{event.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 w-full sm:w-fit">
                      <MapPin className="w-5 h-5 text-indigo-500"/>
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase">Location</p>
                        <span className="text-zinc-900 dark:text-white font-medium">{event.location}</span>
                      </div>
                    </div>
                 </div>

                 {/* WhatsApp Link */}
                 {event.whatsappLink && (
                  <a href={event.whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold rounded-xl hover:bg-green-100 transition-colors mb-8">
                    <MessageCircle className="w-5 h-5" /> Join WhatsApp Group
                  </a>
                 )}

                 {/* Organizer Info */}
                 <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                   <p className="text-xs font-bold text-zinc-400 uppercase mb-2">Organized By</p>
                   <p className="font-medium text-zinc-900 dark:text-white">{event.organizerName || "University Club"}</p>
                 </div>
              </div>

              {/* Right Column: Registration Card */}
              <div className="w-full md:w-80 flex-shrink-0">
                 <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-200 dark:border-zinc-700 sticky top-24 shadow-sm">
                    
                    {/* DYNAMIC ACTION BUTTON */}
                    {isRegistered ? (
                      <button 
                        onClick={() => navigate(`/tickets/${userTicketId}`)} // 👈 Goes to Ticket Page
                        className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-xl shadow-green-500/20 active:scale-95 text-lg flex items-center justify-center gap-2"
                      >
                        <Ticket className="w-5 h-5" /> View Ticket
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
                    
                    {/* Capacity Bar */}
                    <div className="mt-6">
                      <div className="flex justify-between text-xs text-zinc-500 font-medium uppercase tracking-wide mb-2">
                        <span>Capacity</span>
                        <span>{event.ticketsSold}/{event.totalTickets} Filled</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-indigo-500 transition-all duration-500" 
                           style={{ width: `${Math.min((event.ticketsSold / event.totalTickets) * 100, 100)}%` }}
                         ></div>
                      </div>
                    </div>

                    <p className="text-center text-[10px] text-zinc-400 mt-4">
                      Secure registration via UniFlow.
                    </p>
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
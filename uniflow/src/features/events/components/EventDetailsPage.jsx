import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { Calendar, MapPin, Clock, Users, Shield, ArrowLeft, Loader2, Share2, Ticket, AlertCircle } from 'lucide-react';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [alreadyBooked, setAlreadyBooked] = useState(false);

  // 1. Fetch Event Data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, 'events', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
          
          // Check if user already booked
          if (user) {
            const q = query(
              collection(db, 'registrations'), 
              where('eventId', '==', id),
              where('userId', '==', user.uid)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) setAlreadyBooked(true);
          }
        } else {
          // Event doesn't exist (maybe deleted)
          alert("This event no longer exists.");
          navigate('/events');
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, user, navigate]);

  // 2. Handle Booking Logic (Safely)
  const handleBookTicket = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setBookingLoading(true);

    try {
      // 🛡️ CRASH FIX: Handle missing organizerId (Ghost Events)
      // If organizerId is missing, we assign it to 'admin' or the current user to prevent crash.
      const safeOrganizerId = event.organizerId || 'admin_fallback';

      // 1. Generate Unique Ticket Data
      const ticketData = {
        eventId: event.id,
        eventTitle: event.title || 'Untitled Event',
        eventDate: event.date,
        eventLocation: event.location,
        eventImage: event.imageUrl || '',
        userId: user.uid,
        userName: user.displayName || 'Student',
        userEmail: user.email,
        eventCreatorId: safeOrganizerId, // ✅ Uses the Safe ID
        status: 'confirmed',
        bookedAt: serverTimestamp(),
        used: false, // For QR Scanning later
        qrCodeString: `${event.id}_${user.uid}_${Date.now()}` // Unique String for QR
      };

      // 2. Save to Firestore
      await addDoc(collection(db, 'registrations'), ticketData);

      // 3. Success Feedback
      alert("🎉 Ticket Booked Successfully! Check 'My Tickets'.");
      setAlreadyBooked(true);
      navigate('/my-tickets');

    } catch (error) {
      console.error("Booking Error:", error);
      // Show the actual error to helps us debug, but gracefully
      alert(`Booking Failed: ${error.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-24 relative">
      
      {/* 🖼️ Hero Image */}
      <div className="relative h-72 md:h-96 w-full">
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Category Badge */}
        <div className="absolute bottom-6 left-6">
          <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
            {event.category}
          </span>
          <h1 className="mt-2 text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
            {event.title}
          </h1>
        </div>
      </div>

      {/* 📝 Content Container */}
      <div className="max-w-4xl mx-auto px-6 -mt-6 relative z-10">
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-xl border border-zinc-100 dark:border-zinc-800 space-y-8">
          
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-50 dark:bg-black p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1">
              <Calendar className="w-5 h-5 text-indigo-600 mb-1" />
              <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Date</span>
              <span className="text-sm font-bold dark:text-white">{new Date(event.date).toDateString()}</span>
            </div>
            <div className="bg-zinc-50 dark:bg-black p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1">
              <Clock className="w-5 h-5 text-indigo-600 mb-1" />
              <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Time</span>
              <span className="text-sm font-bold dark:text-white">{event.time}</span>
            </div>
            <div className="bg-zinc-50 dark:bg-black p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1 col-span-2">
              <MapPin className="w-5 h-5 text-indigo-600 mb-1" />
              <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Location</span>
              <span className="text-sm font-bold dark:text-white">{event.location}</span>
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-black dark:text-white flex items-center gap-2">
              About Event
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm whitespace-pre-wrap">
              {event.description}
            </p>
          </div>

          {/* Organizer Info */}
          <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                {event.organizerName ? event.organizerName[0] : 'U'}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Organized By</p>
                <p className="text-sm font-bold dark:text-white">{event.organizerName || 'UniFlow Admin'}</p>
              </div>
            </div>
            {event.isUniversityOnly && (
               <div className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-black rounded-full border border-zinc-200 dark:border-zinc-700">
                 <Shield className="w-3 h-3 text-indigo-600" />
                 <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">Official</span>
               </div>
            )}
          </div>

        </div>
      </div>

      {/* 🦶 Sticky Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 z-40 md:static md:bg-transparent md:border-none md:p-6 md:max-w-4xl md:mx-auto">
        <button 
          onClick={handleBookTicket}
          disabled={alreadyBooked || bookingLoading}
          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2
            ${alreadyBooked 
              ? 'bg-green-500 text-white cursor-default shadow-green-500/20' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30'
            }
            ${bookingLoading ? 'opacity-70 cursor-wait' : ''}
          `}
        >
          {bookingLoading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : alreadyBooked ? (
            <>
              <Ticket className="w-5 h-5" /> Ticket Confirmed
            </>
          ) : (
            <>
              Get Ticket • {event.price > 0 ? `₹${event.price}` : 'Free'}
            </>
          )}
        </button>
      </div>

    </div>
  );
};

export default EventDetailsPage;
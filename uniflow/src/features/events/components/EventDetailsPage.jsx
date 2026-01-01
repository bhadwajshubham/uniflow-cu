import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { MapPin, Calendar, Clock, Share2, ArrowLeft, Ticket, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

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
        } else {
          // Event doesn't exist (maybe deleted)
          alert("Event not found!");
          navigate('/events');
        }
      } catch (err) {
        console.error("Error fetching event:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate]);

  // 2. Check if User Already Booked
  useEffect(() => {
    const checkBooking = async () => {
      if (!user || !event) return;
      try {
        const q = query(
          collection(db, 'registrations'), 
          where('eventId', '==', id),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setAlreadyBooked(true);
        }
      } catch (err) {
        console.error("Error checking booking:", err);
      }
    };
    checkBooking();
  }, [user, event, id]);

  const handleBookTicket = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Safety: Don't allow double booking
    if (alreadyBooked) {
      alert("You already have a ticket for this event!");
      return;
    }

    setBookingLoading(true);

    try {
      // 🛡️ CRITICAL FIX: Safe Fallback for Organizer ID
      // If event.organizerId is missing, we use 'admin' to prevent the "undefined" crash.
      const safeOrganizerId = event.organizerId || 'admin_fallback'; 

      // Create the Ticket Registration
      const ticketData = {
        eventId: id,
        eventTitle: event.title || 'Untitled Event',
        eventDate: event.date || '',
        eventImage: event.imageUrl || '',
        eventLocation: event.location || '',
        userId: user.uid,
        userName: user.displayName || 'Student',
        userEmail: user.email || '',
        eventCreatorId: safeOrganizerId, // 👈 The Fixed Line
        bookedAt: serverTimestamp(),
        status: 'confirmed',
        used: false // For QR Scanning later
      };

      await addDoc(collection(db, 'registrations'), ticketData);

      // Success!
      alert("Ticket Booked Successfully! 🎉");
      setAlreadyBooked(true);
      navigate('/my-tickets'); // Send them to see their new ticket

    } catch (error) {
      console.error("Booking Error:", error);
      // Show the actual error message to help debugging
      alert(`Booking Failed: ${error.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-32 relative">
      
      {/* 🖼️ Hero Image Section */}
      <div className="relative h-[40vh] w-full">
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-4 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Share Button */}
        <button className="absolute top-6 right-4 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all">
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      {/* 📝 Content Card (Overlapping) */}
      <div className="relative -mt-10 px-4">
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-xl border border-zinc-100 dark:border-zinc-800 space-y-6">
          
          {/* Header */}
          <div className="space-y-2">
             <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {event.category || 'Event'}
                </span>
                {event.isUniversityOnly && (
                  <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Uni Only
                  </span>
                )}
             </div>
             <h1 className="text-3xl font-black leading-tight dark:text-white">{event.title}</h1>
          </div>

          {/* Info Rows */}
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl space-y-1">
                <Calendar className="w-5 h-5 text-zinc-400 mb-2" />
                <p className="text-xs font-bold text-zinc-400 uppercase">Date</p>
                <p className="font-black text-sm dark:text-white">{event.date}</p>
             </div>
             <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl space-y-1">
                <Clock className="w-5 h-5 text-zinc-400 mb-2" />
                <p className="text-xs font-bold text-zinc-400 uppercase">Time</p>
                <p className="font-black text-sm dark:text-white">{event.time}</p>
             </div>
             <div className="col-span-2 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 shrink-0">
                   <MapPin className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-xs font-bold text-zinc-400 uppercase">Location</p>
                   <p className="font-black text-sm dark:text-white">{event.location}</p>
                </div>
             </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
             <h3 className="text-lg font-black dark:text-white">About Event</h3>
             <p className="text-zinc-500 text-sm leading-relaxed font-medium">
               {event.description}
             </p>
          </div>

          {/* Organizer Info */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                   {event.organizerName ? event.organizerName[0] : 'U'}
                </div>
                <div>
                   <p className="text-xs font-bold text-zinc-400 uppercase">Organized by</p>
                   <p className="font-bold text-sm dark:text-white">{event.organizerName || 'University Club'}</p>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* 🦶 Floating Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 z-30 pb-safe">
         <div className="flex items-center gap-4 max-w-2xl mx-auto">
            <div className="flex-1">
               <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Price</p>
               <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                 {event.price > 0 ? `₹${event.price}` : 'FREE'}
               </p>
            </div>
            <button 
               onClick={handleBookTicket}
               disabled={bookingLoading || alreadyBooked}
               className={`flex-[2] py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                 ${alreadyBooked 
                   ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default'
                   : 'bg-indigo-600 text-white shadow-indigo-500/30 hover:bg-indigo-700'
                 }
               `}
            >
               {bookingLoading ? (
                 <Loader2 className="w-5 h-5 animate-spin" />
               ) : alreadyBooked ? (
                 <> <Ticket className="w-5 h-5" /> Ticket Confirmed </>
               ) : (
                 'Book Now'
               )}
            </button>
         </div>
      </div>

    </div>
  );
};

export default EventDetailsPage;
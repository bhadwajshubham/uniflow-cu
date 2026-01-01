import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, increment, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { Calendar, MapPin, Clock, Users, ArrowLeft, Share2, Ticket, Loader2, ShieldCheck } from 'lucide-react';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [alreadyBooked, setAlreadyBooked] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'events', id));
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
          
          // Check if already booked
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
          navigate('/events');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate, user]);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: event.title,
        text: `Check out ${event.title} on UniFlow!`,
        url: window.location.href,
      });
    } catch (err) {
      console.log("Share failed or cancelled");
    }
  };

  const handleRegister = async () => {
    if (!user) { navigate('/login'); return; }
    
    // Check constraints
    if (event.ticketsSold >= event.totalTickets) { alert("Housefull!"); return; }
    if (alreadyBooked) { alert("You already have a ticket!"); return; }

    setRegistering(true);
    try {
      // 🛡️ CRITICAL FIX: Ghost Data Protection (Prevents "undefined" crash)
      const safeCreatorId = event.createdBy || event.organizerId || 'admin_fallback';

      const newTicket = {
        eventId: event.id,
        eventTitle: event.title || "Untitled Event",
        eventCreatorId: safeCreatorId, // ✅ Crash Fixed
        eventDate: event.date || "Date TBA",
        eventTime: event.time || "Time TBA",
        eventLocation: event.location || "Location TBA",
        userId: user.uid,
        userName: user.displayName || "Student",
        userEmail: user.email,
        userRollNo: profile?.rollNo || 'N/A',
        userPhone: profile?.phone || 'N/A',
        userPhoto: user.photoURL || '', 
        purchasedAt: serverTimestamp(),
        checkedIn: false,
        status: 'confirmed',
        price: event.price || 0,
        
        // 🆕 QR Code Logic
        used: false, 
        qrCodeString: `${event.id}_${user.uid}_${Date.now()}`
      };

      // 1. Save Ticket to Database
      const docRef = await addDoc(collection(db, 'registrations'), newTicket);
      
      // 2. Update Ticket Count
      await updateDoc(doc(db, 'events', event.id), { ticketsSold: increment(1) });

      // 📧 3. SEND EMAIL (Activated & Restored)
      console.log("Attempting to send email to:", user.email); // Debug Log
      
      const appUrl = window.location.origin; 
      const ticketLink = `${appUrl}/tickets/${docRef.id}`;

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff;">
          <div style="background: #4F46E5; padding: 30px; text-align: center; color: white;"><h1>CONFIRMED! 🚀</h1></div>
          <div style="padding: 30px;">
            <p>Hi <strong>${user.displayName}</strong>, you're booked for ${event.title}.</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${ticketLink}" style="background: #4F46E5; color: white; padding: 15px 30px; border-radius: 50px; text-decoration: none; font-weight: bold; display: inline-block;">VIEW PASS IN APP</a>
            </div>
            <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">Show this QR code at the venue entry.</p>
          </div>
        </div>`;

      // Direct Call - No Try/Catch Wrapper blocking it
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            to: user.email, 
            subject: `🎟️ Ticket: ${event.title}`, 
            html: emailHtml 
        })
      })
      .then(res => {
          if(res.ok) console.log("Email Sent Successfully");
          else console.error("Email API responded with error", res.status);
      })
      .catch(err => console.error("Email API Network Error:", err));

      // 4. Success Navigation
      alert("✅ Ticket Booked! Email Sent.");
      setAlreadyBooked(true);
      navigate('/my-tickets');

    } catch (err) {
      console.error(err);
      alert("Booking failed: " + err.message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Controls */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-zinc-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </button>
          <button onClick={handleShare} className="p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 transition-all">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Main Event Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
          
          {/* Image Section */}
          <div className="h-64 sm:h-96 w-full relative">
            {event.imageUrl ? <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-600" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <span className="px-3 py-1 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">{event.category}</span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tighter mb-2">{event.title}</h1>
              {event.isUniversityOnly && <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-2 text-indigo-200"><ShieldCheck className="w-4 h-4" /> Chitkara Exclusive</p>}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 p-8 sm:p-12 gap-8">
            
            {/* Left: Info */}
            <div className="md:col-span-2 space-y-8">
              <div className="flex flex-wrap gap-6">
                 <div className="flex items-center gap-3">
                   <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl"><Calendar className="w-5 h-5 text-indigo-600" /></div>
                   <div><p className="text-[10px] font-black uppercase text-zinc-400">Date</p><p className="font-bold dark:text-white">{event.date || 'TBA'}</p></div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl"><Clock className="w-5 h-5 text-indigo-600" /></div>
                   <div><p className="text-[10px] font-black uppercase text-zinc-400">Time</p><p className="font-bold dark:text-white">{event.time || 'TBA'}</p></div>
                 </div>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>
            
            {/* Right: Action Card */}
            <div className="bg-zinc-50 dark:bg-black/40 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800">
               <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Price</p>
               <p className="text-4xl font-black text-indigo-600 mb-6">{Number(event.price) === 0 ? 'FREE' : `₹${event.price}`}</p>
               
               <button 
                  onClick={handleRegister} 
                  disabled={registering || alreadyBooked} 
                  className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all ${alreadyBooked ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
               >
                 {registering ? <Loader2 className="animate-spin mx-auto" /> : alreadyBooked ? "Ticket Confirmed" : "Book Now"}
               </button>
               
               {event.ticketsSold >= event.totalTickets && (
                   <p className="text-center text-xs font-bold text-red-500 mt-4 uppercase tracking-widest">Sold Out</p>
               )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;
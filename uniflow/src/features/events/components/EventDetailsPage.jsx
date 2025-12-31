import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { Calendar, MapPin, Clock, Users, ArrowLeft, Share2, Ticket, Loader2, ShieldCheck } from 'lucide-react';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'events', id));
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
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
  }, [id, navigate]);

  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!profile?.isProfileComplete) {
      alert("Please complete your profile first!");
      return;
    }

    if (event.ticketsSold >= event.totalTickets) {
      alert("Housefull! No tickets left.");
      return;
    }

    if (event.isUniversityOnly) {
      if (!user.email.endsWith('@chitkara.edu.in')) {
        alert("🔒 Restricted Event: Only Chitkara Emails allowed.");
        return;
      }
    }

    setRegistering(true);

    try {
      // 1. Create Ticket Object with SAFETY CHECKS (|| "TBA")
      const newTicket = {
        eventId: event.id,
        eventTitle: event.title || "Untitled Event",
        eventDate: event.date || "Date TBA",
        eventTime: event.time || "Time TBA", // 🛡️ FIX: Agar time undefined hai toh "Time TBA" use karega
        eventLocation: event.location || "Location TBA", // 🛡️ FIX: Location ke liye bhi safety
        userId: user.uid,
        userName: user.displayName || "Student",
        userEmail: user.email,
        userRollNo: profile.rollNo || 'N/A',
        userPhone: profile.phone || 'N/A',
        userPhoto: user.photoURL || '', 
        purchasedAt: serverTimestamp(),
        checkedIn: false,
        price: event.price || 0
      };

      // 2. Save to Firestore
      const docRef = await addDoc(collection(db, 'registrations'), newTicket);
      
      // 3. Update Event Count
      await updateDoc(doc(db, 'events', event.id), {
        ticketsSold: increment(1)
      });

      // 4. Send Email (Background)
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4F46E5;">Ticket Confirmed! 🎟️</h2>
          <p>Hi <strong>${user.displayName}</strong>,</p>
          <p>You are officially registered for <strong>${event.title}</strong>.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Date:</strong> ${event.date || 'TBA'}</p>
          <p><strong>Time:</strong> ${event.time || 'TBA'}</p>
          <p><strong>Venue:</strong> ${event.location || 'TBA'}</p>
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 12px; color: #888;">SHOW THIS QR CODE AT ENTRY</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${docRef.id}" alt="QR" style="width: 150px;" />
            <p style="font-family: monospace; font-size: 16px; font-weight: bold;">${docRef.id}</p>
          </div>
          <p style="font-size: 12px; color: #999;">Powered by UniFlow</p>
        </div>
      `;

      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: `🎟️ Ticket: ${event.title}`,
          html: emailHtml
        })
      }).catch(err => console.error("Email failed:", err));

      alert("✅ Ticket Booked Successfully!");
      navigate('/my-tickets');

    } catch (err) {
      console.error("Booking Error:", err);
      // More helpful error message for you
      if (err.message.includes("undefined")) {
        alert("System Error: Event data is incomplete. Please contact admin.");
      } else {
        alert("Booking failed: " + err.message);
      }
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!event) return null;

  const isSoldOut = event.ticketsSold >= event.totalTickets;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/events')} className="mb-6 flex items-center gap-2 text-zinc-500 hover:text-indigo-600 transition-colors font-bold text-xs uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </button>

        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <div className="h-64 sm:h-96 w-full bg-zinc-200 dark:bg-zinc-800 relative">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                <Ticket className="w-20 h-20 text-white/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">
                {event.category}
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tighter mb-2">{event.title}</h1>
              {event.isUniversityOnly && (
                <div className="flex items-center gap-2 text-indigo-200">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">Chitkara University Exclusive</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-2 p-8 sm:p-12 space-y-8">
              <div className="flex flex-wrap gap-6">
                 <div className="flex items-center gap-3">
                   <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl"><Calendar className="w-5 h-5 text-indigo-600" /></div>
                   <div>
                     <p className="text-[10px] font-black uppercase text-zinc-400">Date</p>
                     <p className="font-bold dark:text-white">{event.date || 'TBA'}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl"><Clock className="w-5 h-5 text-indigo-600" /></div>
                   <div>
                     <p className="text-[10px] font-black uppercase text-zinc-400">Time</p>
                     <p className="font-bold dark:text-white">{event.time || 'TBA'}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl"><MapPin className="w-5 h-5 text-indigo-600" /></div>
                   <div>
                     <p className="text-[10px] font-black uppercase text-zinc-400">Venue</p>
                     <p className="font-bold dark:text-white">{event.location || 'TBA'}</p>
                   </div>
                 </div>
              </div>

              <div>
                <h3 className="text-lg font-black uppercase tracking-tight mb-4 dark:text-white">About Experience</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>

              {event.whatsappLink && (
                 <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">W</div>
                       <div>
                         <p className="text-xs font-black uppercase text-green-700 dark:text-green-400">Official Group</p>
                         <p className="text-[10px] text-green-600/70 dark:text-green-500/70">Join for updates</p>
                       </div>
                    </div>
                    <a href={event.whatsappLink} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white dark:bg-black text-green-600 font-bold text-xs uppercase tracking-widest rounded-xl shadow-sm">Join</a>
                 </div>
              )}
            </div>

            <div className="bg-zinc-50 dark:bg-black/40 p-8 sm:p-12 border-l border-zinc-100 dark:border-zinc-800 flex flex-col justify-between">
               <div className="space-y-6">
                 <div>
                   <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Price</p>
                   <p className="text-4xl font-black text-indigo-600">{Number(event.price) === 0 ? 'FREE' : `₹${event.price}`}</p>
                 </div>
                 
                 <div>
                   <div className="flex justify-between text-xs font-bold mb-2 dark:text-zinc-400">
                     <span>Capacity</span>
                     <span>{event.ticketsSold} / {event.totalTickets}</span>
                   </div>
                   <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-indigo-600 transition-all duration-1000" 
                       style={{ width: `${(event.ticketsSold / event.totalTickets) * 100}%` }}
                     ></div>
                   </div>
                 </div>

                 {isSoldOut ? (
                   <div className="w-full py-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-400 rounded-2xl font-black text-center uppercase tracking-widest cursor-not-allowed">
                     Sold Out
                   </div>
                 ) : (
                   <button 
                     onClick={handleRegister}
                     disabled={registering}
                     className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     {registering ? <Loader2 className="animate-spin" /> : <><Ticket className="w-5 h-5" /> Book Now</>}
                   </button>
                 )}
               </div>

               <div className="mt-8 text-center">
                 <p className="text-[10px] text-zinc-400 font-medium">
                   By booking, you agree to the <span className="underline decoration-zinc-300">Terms of Service</span>.
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;
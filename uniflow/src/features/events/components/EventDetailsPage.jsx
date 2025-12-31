import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { Calendar, MapPin, Clock, ArrowLeft, Ticket, Loader2, ShieldCheck } from 'lucide-react';

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
        } else { navigate('/events'); }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchEvent();
  }, [id, navigate]);

  const handleRegister = async () => {
    if (!user) { navigate('/login'); return; }
    if (!profile?.isProfileComplete) { alert("Please complete your profile first!"); return; }
    if (event.ticketsSold >= event.totalTickets) { alert("Housefull!"); return; }

    setRegistering(true);
    try {
      // 🛡️ DATA BINDING: Save Creator ID so ONLY they can scan this ticket later
      const newTicket = {
        eventId: event.id,
        eventTitle: event.title || "Untitled",
        eventCreatorId: event.createdBy, // CRITICAL FOR SCANNER SECURITY
        eventDate: event.date || "TBA",
        eventTime: event.time || "TBA",
        eventLocation: event.location || "TBA",
        userId: user.uid,
        userName: user.displayName || "Student",
        userEmail: user.email,
        userRollNo: profile.rollNo || 'N/A',
        purchasedAt: serverTimestamp(),
        checkedIn: false,
        status: 'pending'
      };

      const docRef = await addDoc(collection(db, 'registrations'), newTicket);
      await updateDoc(doc(db, 'events', event.id), { ticketsSold: increment(1) });

      // 📧 MAGIC LINK EMAIL
      const appUrl = window.location.origin; 
      const ticketLink = `${appUrl}/tickets/${docRef.id}`;
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #4F46E5; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0;">YOU'RE GOING! 🚀</h1>
          </div>
          <div style="padding: 30px; color: #334155;">
            <p>Hi <strong>${user.displayName}</strong>, your spot for <strong>${event.title}</strong> is confirmed.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${ticketLink}" style="background-color: #4F46E5; color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: bold;">VIEW TICKET IN APP</a>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
            Powered by UniFlow • Ticket ID: ${docRef.id}
          </div>
        </div>`;

      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: user.email, subject: `🎟️ Ticket: ${event.title}`, html: emailHtml })
      }).catch(e => console.error(e));

      alert("✅ Ticket Booked! Check your email for the access link.");
      navigate('/my-tickets');
    } catch (err) { alert("Error: " + err.message); } finally { setRegistering(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/events')} className="mb-6 flex items-center gap-2 text-zinc-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <div className="h-64 sm:h-96 w-full relative">
            {event.imageUrl ? <img src={event.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-600" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tighter">{event.title}</h1>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 p-8 gap-8">
            <div className="md:col-span-2 space-y-6">
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>
            <div className="space-y-6">
              <button onClick={handleRegister} disabled={registering} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">
                {registering ? <Loader2 className="animate-spin mx-auto" /> : "Book Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;
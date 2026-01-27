import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../lib/firebase';
import { 
  doc, 
  getDoc, 
  runTransaction,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { 
  ArrowLeft, 
  Share2, 
  Loader2, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Ticket
} from 'lucide-react';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [alreadyBooked, setAlreadyBooked] = useState(false);
  const [answers, setAnswers] = useState({});
  const [successTicket, setSuccessTicket] = useState(null);

  /* ---------------- 📧 EMAIL HELPER (ADDED – SAFE) ---------------- */
  const sendConfirmationEmail = async ({ user, event, ticketId }) => {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || 'Guest',
          ticketId,
          eventName: event.title,
          eventDate: event.date,
          eventLocation: event.location,
        }),
      });
    } catch (err) {
      console.error('Email failed (non-blocking):', err);
    }
  };

  /* ---------------- 1. FETCH EVENT & CHECK STATUS ---------------- */
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'events', id));
        if (!docSnap.exists()) {
          navigate('/events');
          return;
        }

        setEvent({ id: docSnap.id, ...docSnap.data() });

        if (user) {
          const ticketRef = doc(db, 'registrations', `${user.uid}_${id}`);
          const ticketSnap = await getDoc(ticketRef);
          if (ticketSnap.exists()) setAlreadyBooked(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate, user]);

  /* ---------------- 2. HANDLE ANSWERS ---------------- */
  const handleAnswerChange = (qid, value) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
  };

  /* ---------------- 3. SAFER REGISTER LOGIC ---------------- */
  const handleRegister = async () => {
    if (!user) return navigate('/login');
    if (!profile?.termsAccepted) return navigate('/consent');

    if (event.customQuestions?.length) {
      const missing = event.customQuestions.find(
        q => q.required && !answers[q.id]
      );
      if (missing) return alert(`Please answer: ${missing.label}`);
    }

    setRegistering(true);

    try {
      const ticketRef = doc(db, 'registrations', `${user.uid}_${event.id}`);
      const eventRef = doc(db, 'events', event.id);

      await runTransaction(db, async (transaction) => {
        const eventSnap = await transaction.get(eventRef);
        const ticketSnap = await transaction.get(ticketRef);

        if (!eventSnap.exists()) throw "Event not found";
        if (ticketSnap.exists()) throw "ALREADY_BOOKED";

        const currentData = eventSnap.data();
        if (currentData.ticketsSold >= currentData.totalTickets) {
          throw "SOLD_OUT";
        }

        const newTicket = {
          eventId: event.id,
          eventTitle: currentData.title,
          eventDate: currentData.date,
          eventTime: currentData.time,
          eventLocation: currentData.location,
          userId: user.uid,
          userName: user.displayName || 'Guest',
          userEmail: user.email,
          userPhone: profile?.phone || '',
          userRollNo: profile?.rollNo || '',
          answers,
          status: 'valid',
          purchasedAt: serverTimestamp()
        };

        transaction.set(ticketRef, newTicket);
        transaction.update(eventRef, {
          ticketsSold: currentData.ticketsSold + 1
        });
      });

      // 🎉 SUCCESS UI
      const ticketId = `${user.uid}_${event.id}`;
      setSuccessTicket({
        id: ticketId,
        title: event.title,
        ...event
      });
      setAlreadyBooked(true);

      // 📧 EMAIL (AFTER TRANSACTION)
      sendConfirmationEmail({
        user,
        event,
        ticketId
      });

    } catch (err) {
      console.error("Registration Error:", err);
      if (err === "ALREADY_BOOKED") alert("You already have a ticket!");
      else if (err === "SOLD_OUT") alert("Tickets are sold out.");
      else alert("Registration failed. Try again.");
    } finally {
      setRegistering(false);
    }
  };

  /* ---------------- 4. RENDER UI ---------------- */
  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );

  if (!event) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-20 pb-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-indigo-600"
          >
            <ArrowLeft size={18} /> BACK
          </button>

          <button
            onClick={() =>
              navigator.share?.({ title: event.title, url: window.location.href })
            }
            className="p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* ACTION BUTTON */}
        <button
          onClick={handleRegister}
          disabled={registering || alreadyBooked}
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em]
            ${alreadyBooked
              ? 'bg-green-500 text-white'
              : 'bg-indigo-600 text-white'
            }`}
        >
          {registering ? (
            <Loader2 className="animate-spin" />
          ) : alreadyBooked ? (
            <>
              <CheckCircle className="inline mr-2" /> Ticket Confirmed
            </>
          ) : (
            <>
              <Ticket className="inline mr-2" /> Book My Seat
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default EventDetailsPage;

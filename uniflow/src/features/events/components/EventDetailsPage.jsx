import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../lib/firebase';
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  increment,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  Share2,
  Ticket,
  Loader2,
  ShieldCheck
} from 'lucide-react';

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
          const eventData = { id: docSnap.id, ...docSnap.data() };
          setEvent(eventData);

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
        url: window.location.href
      });
    } catch {
      // silently ignore
    }
  };

  const handleRegister = async () => {
    // 🔐 AUTH GATE
    if (!user) {
      navigate('/login');
      return;
    }

    // 🔴 CONSENT GATE (ONLY ADDITION)
    if (!profile || profile.termsAccepted !== true) {
      navigate('/consent');
      return;
    }

    // Existing constraints (UNCHANGED)
    if (event.ticketsSold >= event.totalTickets) {
      alert('Housefull!');
      return;
    }

    if (alreadyBooked) {
      alert('You already have a ticket!');
      return;
    }

    setRegistering(true);

    try {
      const safeCreatorId =
        event.createdBy || event.organizerId || 'admin_fallback';

      const newTicket = {
        eventId: event.id,
        eventTitle: event.title || 'Untitled Event',
        eventCreatorId: safeCreatorId,
        eventDate: event.date || 'Date TBA',
        eventTime: event.time || 'Time TBA',
        eventLocation: event.location || 'Location TBA',
        userId: user.uid,
        userName: user.displayName || 'Student',
        userEmail: user.email,
        userRollNo: profile?.rollNo || 'N/A',
        userPhone: profile?.phone || 'N/A',
        userPhoto: user.photoURL || '',
        purchasedAt: serverTimestamp(),
        checkedIn: false,
        status: 'confirmed',
        price: event.price || 0,
        used: false,
        qrCodeString: `${event.id}_${user.uid}_${Date.now()}`
      };

      // 1. Create ticket
      const docRef = await addDoc(collection(db, 'registrations'), newTicket);

      // 2. Increment sold count
      await updateDoc(doc(db, 'events', event.id), {
        ticketsSold: increment(1)
      });

      // 3. Email (UNCHANGED)
      const appUrl = window.location.origin;
      const ticketLink = `${appUrl}/tickets/${docRef.id}`;

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Ticket Confirmed 🎟️</h2>
          <p>You are registered for <strong>${event.title}</strong></p>
          <a href="${ticketLink}">View Ticket</a>
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
      }).catch(() => {});

      alert('✅ Ticket Booked! Email Sent.');
      setAlreadyBooked(true);
      navigate('/my-tickets');
    } catch (err) {
      console.error(err);
      alert('Booking failed: ' + err.message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center gap-2 text-zinc-500 hover:text-indigo-600 font-bold text-xs uppercase"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </button>

          <button
            onClick={handleShare}
            className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Event Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border overflow-hidden">
          <div className="h-64 sm:h-96 relative">
            {event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-indigo-600" />
            )}

            <div className="absolute bottom-6 left-6 text-white">
              <h1 className="text-3xl font-black">{event.title}</h1>
              {event.isUniversityOnly && (
                <p className="text-xs flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> University Only
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 p-8">
            <div className="md:col-span-2 space-y-4">
              <p className="text-zinc-600 dark:text-zinc-400">
                {event.description}
              </p>
            </div>

            <div className="bg-zinc-50 dark:bg-black/40 p-6 rounded-2xl">
              <p className="text-3xl font-black text-indigo-600 mb-4">
                {event.price === 0 ? 'FREE' : `₹${event.price}`}
              </p>

              <button
                onClick={handleRegister}
                disabled={registering || alreadyBooked}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black"
              >
                {registering ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : alreadyBooked ? (
                  'Ticket Confirmed'
                ) : (
                  'Book Now'
                )}
              </button>

              {event.ticketsSold >= event.totalTickets && (
                <p className="text-center text-red-500 text-xs mt-3">
                  Sold Out
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;

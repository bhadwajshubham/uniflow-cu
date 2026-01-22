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
  ArrowLeft,
  Share2,
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
  const [answers, setAnswers] = useState({});

  /* ---------------- FETCH EVENT ---------------- */

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'events', id));
        if (!docSnap.exists()) {
          navigate('/events');
          return;
        }

        const eventData = { id: docSnap.id, ...docSnap.data() };
        setEvent(eventData);

        if (user) {
          const q = query(
            collection(db, 'registrations'),
            where('eventId', '==', id),
            where('userId', '==', user.uid)
          );
          const snap = await getDocs(q);
          if (!snap.empty) setAlreadyBooked(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, navigate, user]);

  /* ---------------- SHARE ---------------- */

  const handleShare = async () => {
    try {
      await navigator.share({
        title: event.title,
        text: `Check out ${event.title} on UniFlow-cu`,
        url: window.location.href
      });
    } catch {}
  };

  /* ---------------- ANSWERS ---------------- */

  const handleAnswerChange = (qid, value) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
  };

  /* ---------------- REGISTER ---------------- */

  const handleRegister = async () => {
    // 🔐 AUTH
    if (!user) {
      navigate('/login');
      return;
    }

    // 🔐 CONSENT
    if (!profile || profile.termsAccepted !== true) {
      navigate('/consent');
      return;
    }

    setRegistering(true);

    try {
      // 🔒 FRESH EVENT CHECK (prevents overselling)
      const freshSnap = await getDoc(doc(db, 'events', event.id));
      if (!freshSnap.exists()) {
        alert('Event not found');
        return;
      }

      const freshEvent = freshSnap.data();
      if (freshEvent.ticketsSold >= freshEvent.totalTickets) {
        alert('Housefull!');
        return;
      }

      // 🛑 DUPLICATE
      if (alreadyBooked) {
        alert('You already registered!');
        return;
      }

      // 🛡 CUSTOM QUESTION VALIDATION
      if (event.customQuestions?.length) {
        const missing = event.customQuestions.find(
          q => q.required && !answers[q.id]
        );
        if (missing) {
          alert(`Please answer: ${missing.label}`);
          return;
        }
      }

      const ticket = {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,

        userId: user.uid,
        userName: user.displayName || 'Student',
        userEmail: user.email,

        userRollNo: profile?.rollNo || '',
        userPhone: profile?.phone || '',

        answers, // ✅ custom question answers

        purchasedAt: serverTimestamp(),

        // ✅ MUST MATCH RULES
        status: 'registered',
        used: false
      };

      await addDoc(collection(db, 'registrations'), ticket);

      await updateDoc(doc(db, 'events', event.id), {
        ticketsSold: increment(1)
      });

      alert('✅ Registration Successful');
      navigate('/my-tickets');
    } catch (err) {
      console.error(err);
      alert('Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  /* ---------------- UI ---------------- */

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

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <button onClick={() => navigate('/events')} className="flex gap-2 text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={handleShare}>
            <Share2 />
          </button>
        </div>

        {/* EVENT CARD */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border">
          <div className="h-64 relative">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-indigo-600" />
            )}

            <div className="absolute bottom-6 left-6 text-white">
              <h1 className="text-3xl font-black">{event.title}</h1>
              {event.isUniversityOnly && (
                <p className="flex gap-1 items-center text-xs">
                  <ShieldCheck size={14} /> University Only
                </p>
              )}
            </div>
          </div>

          <div className="p-8 grid md:grid-cols-3 gap-8">
            {/* DESCRIPTION */}
            <div className="md:col-span-2 space-y-4">
              <p>{event.description}</p>

              {/* CUSTOM QUESTIONS */}
              {event.customQuestions?.length > 0 && (
                <div className="space-y-4 mt-6">
                  <h3 className="font-black text-sm uppercase">
                    Registration Questions
                  </h3>

                  {event.customQuestions.map(q => (
                    <div key={q.id} className="space-y-1">
                      <label className="text-sm font-bold">
                        {q.label} {q.required && '*'}
                      </label>

                      {q.type === 'text' && (
                        <input
                          className="w-full p-2 rounded border"
                          onChange={e => handleAnswerChange(q.id, e.target.value)}
                        />
                      )}

                      {q.type === 'number' && (
                        <input
                          type="number"
                          className="w-full p-2 rounded border"
                          onChange={e => handleAnswerChange(q.id, e.target.value)}
                        />
                      )}

                      {q.type === 'select' && (
                        <select
                          className="w-full p-2 rounded border"
                          onChange={e => handleAnswerChange(q.id, e.target.value)}
                        >
                          <option value="">Select</option>
                          {q.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {q.type === 'checkbox' && (
                        <input
                          type="checkbox"
                          onChange={e => handleAnswerChange(q.id, e.target.checked)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTION */}
            <div className="bg-zinc-50 dark:bg-black/40 p-6 rounded-2xl">
              <button
                onClick={handleRegister}
                disabled={registering || alreadyBooked}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black"
              >
                {registering ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : alreadyBooked ? (
                  'Already Registered'
                ) : (
                  'Register Now'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;

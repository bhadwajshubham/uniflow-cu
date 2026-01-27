import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../lib/firebase';
import { 
  doc, 
  getDoc, 
  runTransaction, // ⚡ The Secret Weapon for Stability
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
  Download,
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
  
  // 🎟️ SUCCESS STATE (Controls the Modal)
  const [successTicket, setSuccessTicket] = useState(null);

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

        // 🔍 CHECK IF ALREADY BOOKED (Client Side Check for UI)
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

    // 🛡️ VALIDATE CUSTOM QUESTIONS
    if (event.customQuestions?.length) {
      const missing = event.customQuestions.find(q => q.required && !answers[q.id]);
      if (missing) return alert(`Please answer: ${missing.label}`);
    }

    setRegistering(true);

    // 🔒 THE ATOMIC TRANSACTION (Prevents Button Spam & Race Conditions)
    try {
      const ticketRef = doc(db, 'registrations', `${user.uid}_${event.id}`);
      const eventRef = doc(db, 'events', event.id);

      await runTransaction(db, async (transaction) => {
        const eventSnap = await transaction.get(eventRef);
        const ticketSnap = await transaction.get(ticketRef);

        if (!eventSnap.exists()) throw "Event not found";
        
        // A. DOUBLE BOOKING CHECK
        if (ticketSnap.exists()) {
          throw "ALREADY_BOOKED"; 
        }

        // B. CAPACITY CHECK
        const currentData = eventSnap.data();
        if (currentData.ticketsSold >= currentData.totalTickets) {
          throw "SOLD_OUT";
        }

        // C. WRITE OPERATIONS
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
            answers: answers,
            status: 'valid',
            purchasedAt: serverTimestamp()
        };

        transaction.set(ticketRef, newTicket);
        transaction.update(eventRef, {
            ticketsSold: currentData.ticketsSold + 1
        });
      });

      // 🎉 SUCCESS! OPEN THE MODAL
      setSuccessTicket({
          id: `${user.uid}_${event.id}`,
          title: event.title,
          ...event
      });
      setAlreadyBooked(true);

    } catch (err) {
      console.error("Registration Error:", err);
      if (err === "ALREADY_BOOKED") alert("You already have a ticket! Check 'My Tickets'.");
      else if (err === "SOLD_OUT") alert("Housefull! Tickets are sold out.");
      else alert("Registration Failed. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  /* ---------------- 4. RENDER UI ---------------- */
  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-20 pb-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={18} /> BACK
          </button>
          <button onClick={() => navigator.share?.({ title: event.title, url: window.location.href })} className="p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm hover:bg-zinc-100">
            <Share2 size={18} className="text-zinc-600 dark:text-zinc-300" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            {/* 🖼️ LEFT COLUMN: VISUALS */}
            <div className="md:col-span-1 space-y-6">
                <div className="rounded-3xl overflow-hidden shadow-xl aspect-[3/4] relative group">
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                        <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest w-max rounded-md mb-2">{event.category}</span>
                        <h1 className="text-2xl font-black text-white leading-tight">{event.title}</h1>
                    </div>
                </div>
            </div>

            {/* 📝 RIGHT COLUMN: DETAILS & FORM */}
            <div className="md:col-span-2 space-y-8 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                
                {/* Event Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <Calendar className="w-5 h-5 text-indigo-600 mb-2" />
                        <p className="text-xs font-bold text-zinc-400 uppercase">Date</p>
                        <p className="font-bold text-zinc-900 dark:text-white">{event.date}</p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <Clock className="w-5 h-5 text-indigo-600 mb-2" />
                        <p className="text-xs font-bold text-zinc-400 uppercase">Time</p>
                        <p className="font-bold text-zinc-900 dark:text-white">{event.time}</p>
                    </div>
                    <div className="col-span-2 p-4 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600"><MapPin className="w-5 h-5" /></div>
                        <div>
                            <p className="text-xs font-bold text-zinc-400 uppercase">Venue</p>
                            <p className="font-bold text-zinc-900 dark:text-white">{event.location}</p>
                        </div>
                    </div>
                </div>

                <div className="prose dark:prose-invert text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                    <p>{event.description}</p>
                </div>

                {/* 📝 FORM (Custom Questions) */}
                {event.customQuestions?.length > 0 && !alreadyBooked && (
                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-bottom-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600">Required Details</h3>
                        {event.customQuestions.map(q => (
                            <div key={q.id} className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                    {q.label} {q.required && <span className="text-red-500">*</span>}
                                </label>
                                {q.type === 'select' ? (
                                    <select className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                        onChange={e => handleAnswerChange(q.id, e.target.value)}>
                                        <option value="">Select an option</option>
                                        {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                ) : (
                                    <input type={q.type === 'number' ? 'number' : 'text'} 
                                        className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                        onChange={e => handleAnswerChange(q.id, e.target.value)} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* 🚀 ACTION BUTTON */}
                <button 
                    onClick={handleRegister}
                    disabled={registering || alreadyBooked}
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3
                    ${alreadyBooked 
                        ? 'bg-green-500 text-white cursor-default shadow-green-200 dark:shadow-none' 
                        : 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none hover:bg-indigo-700'
                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                    {registering ? <Loader2 className="animate-spin" /> : alreadyBooked ? (
                        <> <CheckCircle className="w-5 h-5" /> Ticket Confirmed </>
                    ) : (
                        <> <Ticket className="w-5 h-5" /> Book My Seat </>
                    )}
                </button>
            </div>
        </div>

        {/* =======================================================
            🎉 IMPRESSIVE SUCCESS MODAL (SCREENSHOT FRIENDLY)
            No Email? No Problem. This is your digital pass.
           ======================================================= */}
        {successTicket && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in zoom-in-95 duration-300">
                <div className="bg-white text-black w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative">
                    
                    {/* Top Stripe */}
                    <div className="h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                    <div className="p-8 text-center space-y-6">
                        
                        {/* Success Icon */}
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-2">
                            <CheckCircle className="w-8 h-8" />
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-2xl font-black uppercase tracking-tight">You're In!</h2>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Please Screenshot This Ticket</p>
                        </div>

                        {/* 🎫 THE TICKET CARD */}
                        <div className="bg-zinc-50 border-2 border-dashed border-zinc-300 p-6 rounded-2xl relative group cursor-pointer hover:bg-zinc-100 transition-colors">
                            {/* QR Code via Public API (Fastest Way) */}
                            <div className="w-40 h-40 bg-white mx-auto rounded-xl p-2 shadow-sm mb-4">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${successTicket.id}`} 
                                  alt="Ticket QR" 
                                  className="w-full h-full object-contain mix-blend-multiply" 
                                />
                            </div>
                            <p className="text-[10px] font-mono text-zinc-400 break-all">{successTicket.id}</p>
                        </div>

                        {/* Details */}
                        <div className="text-left space-y-2 bg-indigo-50/50 p-4 rounded-xl">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-400 uppercase">Event</span>
                                <span className="text-xs font-black text-indigo-900 text-right">{successTicket.title}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-400 uppercase">Attendee</span>
                                <span className="text-xs font-black text-indigo-900 text-right">{user.displayName}</span>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button 
                            onClick={() => {
                                setSuccessTicket(null);
                                navigate('/my-tickets');
                            }}
                            className="w-full py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                        >
                            View All Tickets
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default EventDetailsPage;
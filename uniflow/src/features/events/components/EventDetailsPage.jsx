import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
// ✅ Import the Fixed Service
import { registerForEvent } from '../services/registrationService';
import { ArrowLeft, Share2, Loader2, MapPin, Calendar, Clock, CheckCircle, Ticket } from 'lucide-react';
import QRCode from 'react-qr-code'; 

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

  // 1. Fetch Event
  useEffect(() => {
    const init = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'events', id));
        if (!docSnap.exists()) return navigate('/events');
        
        setEvent({ id: docSnap.id, ...docSnap.data() });

        if (user) {
          // Check if booked
          const ticketSnap = await getDoc(doc(db, 'registrations', `${id}_${user.uid}`));
          if (ticketSnap.exists()) setAlreadyBooked(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, user, navigate]);

  // 2. Handle Registration
  const handleRegister = async () => {
    if (!user) return navigate('/login');
    if (!profile?.termsAccepted) return navigate('/consent');

    if (event.customQuestions?.length) {
      const missing = event.customQuestions.find(q => q.required && !answers[q.id]);
      if (missing) return alert(`Please answer: ${missing.label}`);
    }

    setRegistering(true);

    try {
      // 🚀 Use the new Service (triggers DB + Email)
      await registerForEvent(event.id, user, profile, answers);
      
      setAlreadyBooked(true);
      setSuccessTicket({
        id: `${event.id}_${user.uid}`,
        title: event.title,
        userName: user.displayName,
        ...event
      });

    } catch (err) {
      const msg = err.message;
      if (msg.includes("SOLD_OUT")) alert("😢 Sold Out!");
      else if (msg.includes("ALREADY_BOOKED")) alert("You already have a ticket!");
      else if (msg.includes("Restricted")) alert(msg);
      else alert("Registration failed. Try again.");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-20 pb-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={18} /> BACK
          </button>
          <button onClick={() => navigator.share?.({ title: event.title, url: window.location.href })} className="p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm hover:bg-zinc-100">
            <Share2 size={18} className="text-zinc-600 dark:text-zinc-300" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
                <div className="rounded-3xl overflow-hidden shadow-xl aspect-[3/4] relative group">
                    {/* 🛡️ FIX: FALLBACK IMAGE */}
                    <img 
                      src={event.imageUrl || "https://placehold.co/600x800?text=No+Image"} 
                      alt={event.title} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                        <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest w-max rounded-md mb-2">{event.category}</span>
                        <h1 className="text-2xl font-black text-white leading-tight">{event.title}</h1>
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 space-y-8 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                {/* Event Details */}
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

                {/* Custom Questions */}
                {event.customQuestions?.length > 0 && !alreadyBooked && (
                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600">Required Details</h3>
                        {event.customQuestions.map(q => (
                            <div key={q.id} className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                    {q.label} {q.required && <span className="text-red-500">*</span>}
                                </label>
                                {q.type === 'select' ? (
                                    <select className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                        onChange={e => setAnswers({...answers, [q.id]: e.target.value})}>
                                        <option value="">Select an option</option>
                                        {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                ) : (
                                    <input type={q.type === 'number' ? 'number' : 'text'} 
                                        className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                        onChange={e => setAnswers({...answers, [q.id]: e.target.value})} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

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

        {/* Success Modal */}
        {successTicket && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in zoom-in-95 duration-300">
                <div className="bg-white text-black w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative">
                    <div className="h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    <div className="p-8 text-center space-y-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-2">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black uppercase tracking-tight">You're In!</h2>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Please Screenshot This Ticket</p>
                        </div>
                        <div className="bg-zinc-50 border-2 border-dashed border-zinc-300 p-6 rounded-2xl relative">
                            <div className="w-40 h-40 bg-white mx-auto rounded-xl p-2 shadow-sm mb-4">
                                <QRCode value={successTicket.id} size={160} />
                            </div>
                            <p className="text-[10px] font-mono text-zinc-400 break-all">{successTicket.id}</p>
                        </div>
                        <button 
                            onClick={() => navigate('/my-tickets')}
                            className="w-full py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all"
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
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Calendar, MapPin, Clock, Users, ArrowLeft, CheckCircle, ShieldCheck 
} from 'lucide-react';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [teamError, setTeamError] = useState('');

  // Fetch Logic (Same as before)
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventRef = doc(db, 'events', id);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          setEvent({ id: eventSnap.id, ...eventSnap.data() });
          if (user) {
            const q = query(collection(db, 'registrations'), where('eventId', '==', id), where('userId', '==', user.uid));
            const regSnap = await getDocs(q);
            if (!regSnap.empty) setRegistrationStatus('registered');
          }
        }
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchEventData();
  }, [id, user]);

  const handleRegister = async () => {
    if (!user) { navigate('/login'); return; }
    if (event.type === 'team' && !teamName.trim()) { setTeamError('Team Name required'); return; }
    setRegistering(true);
    try {
      await addDoc(collection(db, 'registrations'), {
        eventId: event.id, eventTitle: event.title, eventDate: event.date, eventTime: event.time, eventLocation: event.location,
        userId: user.uid, userName: user.displayName || 'Student', userEmail: user.email, status: 'confirmed',
        type: event.type, teamName: event.type === 'team' ? teamName : null,
        teamCode: event.type === 'team' ? `${Math.floor(1000 + Math.random() * 9000)}` : null, createdAt: serverTimestamp()
      });
      setRegistrationStatus('registered');
      navigate('/my-tickets');
    } catch (error) { alert("Failed"); } finally { setRegistering(false); }
  };

  if (loading) return <div className="min-h-screen pt-24 flex justify-center bg-[#FDFBF7] dark:bg-black"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  if (!event) return <div className="min-h-screen pt-24 flex justify-center bg-[#FDFBF7] dark:bg-black">Event not found.</div>;

  return (
    // 🎨 ANTI-EYE STRAIN BACKGROUND
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-black pb-24 relative transition-colors duration-500">
      
      {/* 🖼️ HERO IMAGE (Dimmed slightly for comfort) */}
      <div className="h-[45vh] w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] dark:from-black to-transparent z-10"></div>
        <div className="absolute inset-0 bg-black/10 z-0"></div> {/* Subtle tint overlay */}
        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
        
        <button onClick={() => navigate(-1)} className="absolute top-24 left-6 z-20 p-3 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full text-zinc-800 dark:text-white hover:bg-white transition-all shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* 📄 CONTENT CARD (Softened) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-20 -mt-24">
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl shadow-zinc-200/50 dark:shadow-none p-8 border border-zinc-100 dark:border-zinc-800">
          
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wide">
                {event.category}
              </span>
              {event.isRestricted && (
                <span className="px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Chitkara Only
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white leading-tight mb-2">
              {event.title}
            </h1>
            <p className="text-zinc-500 font-medium">
              Organized by <span className="text-zinc-900 dark:text-zinc-300 font-bold">{event.organizerName}</span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            
            {/* Left: Details */}
            <div className="md:col-span-2 space-y-8">
              <div className="prose dark:prose-invert">
                <h3 className="text-xl font-bold mb-3">About</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#F8F9FA] dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                  <Calendar className="w-5 h-5 text-indigo-600 mb-2" />
                  <p className="text-xs text-zinc-400 font-bold uppercase">Date</p>
                  <p className="font-semibold">{event.date}</p>
                </div>
                <div className="p-4 bg-[#F8F9FA] dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                  <Clock className="w-5 h-5 text-indigo-600 mb-2" />
                  <p className="text-xs text-zinc-400 font-bold uppercase">Time</p>
                  <p className="font-semibold">{event.time}</p>
                </div>
                <div className="col-span-2 p-4 bg-[#F8F9FA] dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                  <MapPin className="w-5 h-5 text-indigo-600 mb-2" />
                  <p className="text-xs text-zinc-400 font-bold uppercase">Location</p>
                  <p className="font-semibold">{event.location}</p>
                </div>
              </div>
            </div>

            {/* Right: Action */}
            <div className="md:col-span-1">
              <div className="sticky top-24 bg-[#F8F9FA] dark:bg-zinc-800/30 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-bold text-zinc-500">Price</span>
                  <span className="text-2xl font-black text-zinc-900 dark:text-white">
                    {event.price > 0 ? `₹${event.price}` : 'Free'}
                  </span>
                </div>

                {event.type === 'team' && !registrationStatus && (
                  <div className="mb-4">
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Team Name</label>
                    <input 
                      type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. CodeWarriors"
                      className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                )}

                {registrationStatus === 'registered' ? (
                  <button onClick={() => navigate('/my-tickets')} className="w-full py-3.5 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-md shadow-green-200 dark:shadow-none"><CheckCircle className="w-5 h-5" /> Registered</button>
                ) : (
                  <button onClick={handleRegister} disabled={registering} className="w-full py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-zinc-200 dark:shadow-none disabled:opacity-50">
                    {registering ? 'Processing...' : (event.price > 0 ? 'Buy Ticket' : 'Register Now')}
                  </button>
                )}
                
                <p className="text-center text-xs text-zinc-400 mt-4">{event.totalTickets - (event.ticketsSold || 0)} spots left</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;
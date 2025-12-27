import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Calendar, MapPin, Clock, Users, Tag, AlertCircle, 
  CheckCircle, ArrowLeft, Share2, DollarSign, Ticket, ShieldCheck 
} from 'lucide-react';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null); // 'registered' | null
  
  // Team Registration State
  const [teamName, setTeamName] = useState('');
  const [teamError, setTeamError] = useState('');

  // 1. Fetch Event & Registration Status
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        // Fetch Event Details
        const eventRef = doc(db, 'events', id);
        const eventSnap = await getDoc(eventRef);
        
        if (eventSnap.exists()) {
          setEvent({ id: eventSnap.id, ...eventSnap.data() });
          
          // Check if User is Already Registered
          if (user) {
            const q = query(
              collection(db, 'registrations'),
              where('eventId', '==', id),
              where('userId', '==', user.uid)
            );
            const regSnap = await getDocs(q);
            if (!regSnap.empty) {
              setRegistrationStatus('registered');
            }
          }
        } else {
          console.error("Event not found");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id, user]);

  // 2. Registration Logic
  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (event.type === 'team' && !teamName.trim()) {
      setTeamError('Team Name is required for this event.');
      return;
    }

    setRegistering(true);
    setTeamError('');

    try {
      // Create Registration
      await addDoc(collection(db, 'registrations'), {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        userId: user.uid,
        userName: user.displayName || 'Student',
        userEmail: user.email,
        status: 'confirmed',
        type: event.type, // 'solo' or 'team'
        teamName: event.type === 'team' ? teamName : null,
        teamCode: event.type === 'team' ? `${Math.floor(1000 + Math.random() * 9000)}` : null, // Simple 4-digit code
        createdAt: serverTimestamp()
      });

      // Update Local UI
      setRegistrationStatus('registered');
      alert('Registration Successful! Check "My Tickets".');
      navigate('/my-tickets');

    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-zinc-50 dark:bg-black text-zinc-500">
        <p>Event not found.</p>
        <button onClick={() => navigate('/events')} className="mt-4 text-indigo-600 font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-24 relative">
      
      {/* 🖼️ HERO IMAGE BACKGROUND */}
      <div className="h-[50vh] w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-black to-transparent z-10"></div>
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-indigo-900 flex items-center justify-center">
            <Calendar className="w-20 h-20 text-white/20" />
          </div>
        )}
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-24 left-6 z-20 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* 📄 CONTENT CARD */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-20 -mt-32">
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl p-6 md:p-10 border border-zinc-100 dark:border-zinc-800">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wide">
                {event.category || 'Event'}
              </span>
              {event.isRestricted && (
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Chitkara Only
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white leading-tight mb-2">
              {event.title}
            </h1>
            <p className="text-zinc-500 font-medium flex items-center gap-2">
              Organized by <span className="text-zinc-900 dark:text-zinc-300 font-bold">{event.organizerName || 'UniFlow Club'}</span>
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            
            {/* Left Column: Details */}
            <div className="md:col-span-2 space-y-8">
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-xl font-bold mb-3">About Event</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                  {event.description || "No description provided."}
                </p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                  <Calendar className="w-5 h-5 text-indigo-600 mb-2" />
                  <p className="text-xs text-zinc-500 font-bold uppercase">Date</p>
                  <p className="font-semibold">{event.date}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                  <Clock className="w-5 h-5 text-indigo-600 mb-2" />
                  <p className="text-xs text-zinc-500 font-bold uppercase">Time</p>
                  <p className="font-semibold">{event.time}</p>
                </div>
                <div className="col-span-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                  <MapPin className="w-5 h-5 text-indigo-600 mb-2" />
                  <p className="text-xs text-zinc-500 font-bold uppercase">Location</p>
                  <p className="font-semibold">{event.location}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Action Card */}
            <div className="md:col-span-1">
              <div className="sticky top-24 bg-zinc-50 dark:bg-zinc-800/30 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-bold text-zinc-500">Ticket Price</span>
                  <span className="text-2xl font-black text-zinc-900 dark:text-white">
                    {event.price > 0 ? `₹${event.price}` : 'Free'}
                  </span>
                </div>

                {/* Team Input Logic */}
                {event.type === 'team' && !registrationStatus && (
                  <div className="mb-4">
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Team Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. CodeWarriors"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {teamError && <p className="text-xs text-red-500 mt-1 font-bold">{teamError}</p>}
                    <p className="text-[10px] text-zinc-400 mt-2 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Max size: {event.teamSize} members
                    </p>
                  </div>
                )}

                {/* Register Button */}
                {registrationStatus === 'registered' ? (
                  <button 
                    onClick={() => navigate('/my-tickets')}
                    className="w-full py-4 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-200 dark:shadow-none"
                  >
                    <CheckCircle className="w-5 h-5" /> Registered
                  </button>
                ) : (
                  <button 
                    onClick={handleRegister}
                    disabled={registering}
                    className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {registering ? 'Processing...' : (event.price > 0 ? 'Buy Ticket' : 'Register Now')}
                  </button>
                )}
                
                <p className="text-center text-xs text-zinc-400 mt-4">
                  {event.totalTickets - (event.ticketsSold || 0)} spots remaining
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
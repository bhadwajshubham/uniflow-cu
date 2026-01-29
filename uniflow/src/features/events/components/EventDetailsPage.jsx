import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
// 👇 YE LINE FIX KI HAI (Ab ye sahi file uthayega)
import { registerForEvent } from '../services/registrationService'; 
import { 
  Calendar, MapPin, Clock, Users, Share2, ArrowLeft, 
  CheckCircle, AlertCircle, Loader2, QrCode, X 
} from 'lucide-react';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Data States
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // UI States
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  // 1. Fetch Event Data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, 'events', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Event not found');
        }
      } catch (err) {
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  // 2. Share Function
  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: event?.title || 'UniFlow Event',
      text: `Check out ${event?.title} on UniFlow!`,
      url: url
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!'); 
      }
    } catch (err) {
      console.error('Share failed:', err);
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch (clipErr) {
        alert('Could not share link.');
      }
    }
  };

  // 3. BOOKING HANDLER
  const handleRegisterClick = () => {
    if (!user) { navigate('/login'); return; }
    
    // Check Profile Completion
    if (!profile?.isProfileComplete) {
      alert("Please complete your profile first!");
      navigate('/profile');
      return;
    }
    setShowModal(true);
  };

  const confirmRegistration = async () => {
    if (!termsChecked || !privacyChecked) return;
    setRegistering(true);
    setError(null);

    try {
      // 🔄 Sync Consent
      await setDoc(doc(db, "users", user.uid), { 
        termsAccepted: true, 
        updatedAt: new Date() 
      }, { merge: true });

      // Create Ticket
      await registerForEvent(event.id, user, profile);
      
      // Update Local Count
      setEvent(prev => ({ 
        ...prev, 
        ticketsSold: (prev.ticketsSold || 0) + 1 
      }));

      setSuccessMsg('Ticket Booked Successfully!');
      setShowModal(false);
      
      // Redirect
      setTimeout(() => navigate('/my-tickets'), 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;
  if (!event) return <div className="flex h-screen items-center justify-center text-red-500 font-bold">Event not found</div>;

  const isSoldOut = event.ticketsSold >= event.totalTickets;
  const progress = Math.min((event.ticketsSold / event.totalTickets) * 100, 100);

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-24">
      
      {/* HEADER IMAGE */}
      <div className="relative h-64 sm:h-80 w-full">
        <img 
          src={event.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80'} 
          alt={event.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition">
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* TOP ACTIONS */}
        <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => setShowQRModal(true)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition">
                <QrCode className="w-6 h-6" />
            </button>
            <button onClick={handleShare} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition">
                <Share2 className="w-6 h-6" />
            </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-5 -mt-8 relative z-10">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border border-zinc-100 dark:border-zinc-800">
          
          <div className="flex justify-between items-start mb-2">
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-full">
              {event.category}
            </span>
            {isSoldOut && <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold uppercase rounded-full">Sold Out</span>}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
            {event.title}
          </h1>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <span className="font-medium text-sm">
                {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
              <Clock className="w-5 h-5 text-indigo-500" />
              <span className="font-medium text-sm">{event.time}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
              <MapPin className="w-5 h-5 text-indigo-500" />
              <span className="font-medium text-sm">{event.venue}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
              <Users className="w-5 h-5 text-indigo-500" />
              <span className="font-medium text-sm">{event.organizer}</span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-2">About Event</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          <div className="mb-4">
             <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-zinc-500">Seats Filled</span>
                <span className="text-indigo-600">{event.ticketsSold} / {event.totalTickets}</span>
             </div>
             <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                   className={`h-full transition-all duration-500 ${isSoldOut ? 'bg-red-500' : 'bg-indigo-600'}`} 
                   style={{ width: `${progress}%` }} 
                />
             </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
             <p className="text-xs text-zinc-400 uppercase font-bold">Price</p>
             <p className="text-xl font-black text-zinc-900 dark:text-white">Free</p>
          </div>
          <button 
            onClick={handleRegisterClick}
            disabled={isSoldOut || registering}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95
              ${isSoldOut ? 'bg-zinc-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'}
            `}
          >
            {registering ? <Loader2 className="animate-spin w-5 h-5" /> : isSoldOut ? 'Sold Out' : 'Book Ticket'}
          </button>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-black text-zinc-900 dark:text-white">Confirm Booking</h3>
               <button onClick={() => setShowModal(false)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500">
                 <X className="w-5 h-5" />
               </button>
            </div>

            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl cursor-pointer">
                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${termsChecked ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-400 bg-white'}`}>
                  {termsChecked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
                <input type="checkbox" checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)} className="hidden" />
                <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed select-none">
                  I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold hover:underline" onClick={(e) => e.stopPropagation()}>Terms & Conditions</a>.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl cursor-pointer">
                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${privacyChecked ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-400 bg-white'}`}>
                  {privacyChecked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
                <input type="checkbox" checked={privacyChecked} onChange={(e) => setPrivacyChecked(e.target.checked)} className="hidden" />
                <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed select-none">
                  I accept the <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold hover:underline" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>.
                </span>
              </label>
            </div>

            <button 
              onClick={confirmRegistration}
              disabled={!termsChecked || !privacyChecked || registering}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
               {registering ? <Loader2 className="animate-spin w-5 h-5" /> : "Confirm & Book"}
            </button>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-2xl text-center max-w-xs w-full relative">
             <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 p-2 bg-zinc-100 rounded-full text-zinc-500 hover:bg-zinc-200">
               <X className="w-5 h-5" />
             </button>
             
             <h3 className="text-lg font-bold text-zinc-900 mb-1">Scan to Book</h3>
             <p className="text-xs text-zinc-500 mb-4">{event.title}</p>
             
             <div className="bg-white p-2 rounded-xl border-2 border-dashed border-indigo-200 inline-block">
                <img 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.href}&color=4f46e5`}
                   alt="Event QR"
                   className="w-48 h-48 object-contain"
                />
             </div>
             <p className="text-[10px] text-zinc-400 mt-4">Share this QR with friends to invite them.</p>
          </div>
        </div>
      )}

      {/* TOASTS */}
      {error && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-xl text-sm font-bold flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5"><AlertCircle className="w-4 h-4"/>{error}</div>}
      {successMsg && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-xl text-sm font-bold flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5"><CheckCircle className="w-4 h-4"/>{successMsg}</div>}

    </div>
  );
};

export default EventDetailsPage;
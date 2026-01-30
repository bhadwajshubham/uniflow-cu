import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Calendar, MapPin, ArrowLeft, Loader2, QrCode, X, CheckCircle, Info } from 'lucide-react';
import { registerForEvent } from '../services/registrationService';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Data States
  const [event, setEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isHousefull, setIsHousefull] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  
  // Modals
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  // 1. Fetch Data & Status
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        setUser(currentUser);

        // A. Fetch User Profile (if logged in)
        if (currentUser) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data());
          }
        }

        // B. Fetch Event Data
        const eventRef = doc(db, "events", id);
        const eventSnap = await getDoc(eventRef);

        if (eventSnap.exists()) {
            const evtData = eventSnap.data();
            setEvent({ id: eventSnap.id, ...evtData });

            // 🔥 LOGIC 1: Check if Already Booked
            // Hum seedha Event ke participants array check kar rahe hain (Fastest & Safest)
            if (currentUser && evtData.participants && evtData.participants.includes(currentUser.uid)) {
                setIsRegistered(true);
            }

            // 🔥 LOGIC 2: Check Housefull
            if (evtData.registered >= evtData.totalTickets) {
                setIsHousefull(true);
            }

            // 🔥 LOGIC 3: Check if Closed Manually
            if (evtData.isOpen === false) {
                setIsClosed(true);
            }
        }
      } catch (error) { 
        console.error("Error fetching details:", error);
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, [id, auth.currentUser]);

  // 2. Pre-Booking Checks
  const checkRequirements = () => {
    if (!user) { navigate('/login'); return false; }
    
    // Check Terms
    if (!profile?.termsAccepted) { 
        setShowConsentModal(true); 
        return false; 
    }
    return true;
  };

  // 3. Handle Terms Acceptance
  const handleAgreeToTerms = async () => {
    if (!termsChecked) { alert("Please accept the terms."); return; }
    try {
      setRegistering(true); // Temporary loading state
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { termsAccepted: true }, { merge: true });
      
      setProfile(prev => ({ ...prev, termsAccepted: true }));
      setShowConsentModal(false);
      setRegistering(false);
      
      // Auto-trigger booking after consent
      executeBooking();
    } catch (error) { 
        alert(error.message); 
        setRegistering(false);
    }
  };

  // 4. Final Booking Action
  const executeBooking = async () => {
    try {
      setRegistering(true);
      
      // Backend Service Call
      await registerForEvent(event.id, user, profile);
      
      // Update UI on Success
      setIsRegistered(true); 
      setShowSuccessModal(true);
      
    } catch (error) { 
        console.error(error);
        alert("Booking Failed: " + error.message); 
    } finally { 
        setRegistering(false); 
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600"/>
    </div>
  );

  if (!event) return <div className="p-10 text-center">Event Not Found</div>;

  const eventImage = event.image || event.imageUrl || null;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-32 pt-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="group flex items-center text-zinc-500 hover:text-indigo-600 mb-6 transition-colors">
        <div className="p-2 bg-white dark:bg-zinc-800 rounded-full mr-3 shadow-sm group-hover:shadow-md transition-all">
            <ArrowLeft className="w-5 h-5" /> 
        </div>
        <span className="font-bold text-sm">Back to Events</span>
      </button>
      
      {/* 🖼️ Event Hero Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl shadow-zinc-200/50 dark:shadow-none overflow-hidden border border-zinc-100 dark:border-zinc-800 relative">
        
        {/* Image Background */}
        <div className={`relative h-64 sm:h-96 w-full ${!eventImage ? 'bg-gradient-to-r from-indigo-600 to-purple-700' : 'bg-black'}`}>
           {eventImage && <img src={eventImage} alt={event.title} className="w-full h-full object-cover opacity-90"/>}
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
           
           {/* Title & Badge Over Image */}
           <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-20">
             <div className="flex items-center gap-3 mb-3">
                 <span className="bg-white/20 backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/10">
                    {event.category || 'Tech'}
                 </span>
                 {isHousefull && <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Housefull</span>}
             </div>
             <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">{event.title}</h1>
             <div className="flex flex-wrap gap-6 mt-4 text-sm font-medium opacity-90">
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-indigo-400"/>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-indigo-400"/>{event.venue || 'TBA'}</span>
             </div>
           </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-3">About Event</h3>
            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-lg whitespace-pre-wrap">{event.description}</p>
          </div>
          
          {/* 🔥 DYNAMIC ACTION BUTTON */}
          <div className="mt-10 pt-8 border-t border-dashed border-zinc-200 dark:border-zinc-800">
            {isRegistered ? (
                // ✅ STATE 1: ALREADY BOOKED
                <button disabled className="w-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 py-4 rounded-2xl font-black text-lg flex justify-center items-center gap-3 border border-green-200 dark:border-green-800 cursor-default">
                    <CheckCircle className="w-6 h-6 fill-green-600 text-white dark:text-black"/> 
                    TICKET CONFIRMED
                </button>
            ) : isClosed ? (
                // ⛔ STATE 2: REGISTRATION CLOSED (Admin Toggle)
                <button disabled className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-black text-lg flex justify-center items-center gap-3 cursor-not-allowed">
                    <X className="w-6 h-6"/> REGISTRATION CLOSED
                </button>
            ) : isHousefull ? (
                // 🏠 STATE 3: HOUSEFULL
                <button disabled className="w-full bg-red-50 dark:bg-red-900/20 text-red-500 py-4 rounded-2xl font-black text-lg flex justify-center items-center gap-3 border border-red-200 dark:border-red-900 cursor-not-allowed">
                    <Info className="w-6 h-6"/> HOUSEFULL
                </button>
            ) : (
                // 🚀 STATE 4: READY TO BOOK
                <button 
                    onClick={() => checkRequirements() && executeBooking()} 
                    disabled={registering} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 dark:shadow-none flex justify-center items-center gap-3 transition-all"
                >
                    {registering ? <Loader2 className="animate-spin w-6 h-6"/> : "BOOK TICKET NOW"}
                </button>
            )}
            
            {!isRegistered && !isClosed && !isHousefull && (
                <p className="text-center text-xs text-zinc-400 mt-3 font-medium">
                    ⚡ Fast booking. Ticket sent to email instantly.
                </p>
            )}
          </div>
        </div>
      </div>

      {/* 🎉 SUCCESS MODAL (Beautiful Ticket) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
                {/* Purple Gradient Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-inner border border-white/20">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">You're In!</h2>
                    <p className="text-indigo-100 font-medium mt-1">Ticket has been emailed to you.</p>
                </div>

                <div className="p-6 text-center space-y-4">
                    <div className="bg-zinc-50 dark:bg-black border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4">
                         <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Event</p>
                         <p className="text-lg font-black text-zinc-800 dark:text-white line-clamp-1">{event.title}</p>
                    </div>

                    <button onClick={() => navigate('/my-tickets')} className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                        <QrCode className="w-5 h-5"/> View Digital Ticket
                    </button>
                    
                    <button onClick={() => setShowSuccessModal(false)} className="w-full py-3 text-zinc-400 font-bold text-sm hover:text-zinc-600 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 🛡️ CONSENT MODAL */}
      {showConsentModal && (
         <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl animate-in slide-in-from-bottom-10">
             <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                <Info className="w-6 h-6"/>
             </div>
             <h3 className="font-black text-2xl mb-2 dark:text-white">Almost There</h3>
             <p className="text-zinc-500 text-sm mb-6 leading-relaxed">To ensure a safe environment, please agree to our community guidelines and privacy policy.</p>
             
             <label className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-black rounded-xl cursor-pointer border border-zinc-100 dark:border-zinc-800 mb-6 group hover:border-indigo-500 transition-colors">
                <input type="checkbox" checked={termsChecked} onChange={e=>setTermsChecked(e.target.checked)} className="mt-1 w-5 h-5 accent-indigo-600"/>
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 transition-colors">I agree to the Terms & Conditions</span>
             </label>
             
             <button onClick={handleAgreeToTerms} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none">
                Confirm & Book
             </button>
             <button onClick={() => setShowConsentModal(false)} className="w-full mt-3 py-3 text-zinc-400 font-bold text-sm hover:text-zinc-600">Cancel</button>
           </div>
         </div>
      )}
    </div>
  );
};

export default EventDetailsPage;
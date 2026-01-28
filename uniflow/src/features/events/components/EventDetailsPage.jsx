import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Calendar, MapPin, Clock, Users, ArrowLeft, Share2, AlertCircle, CheckCircle } from 'lucide-react';
import { registerForEvent, registerTeam, joinTeam } from '../services/registrationService';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State Management
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // Local Profile State
  
  // Modals
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamMode, setTeamMode] = useState('create'); // 'create' or 'join'
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');

  // 1. Fetch Event & User Profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // A. Get Current User
        const currentUser = auth.currentUser;
        setUser(currentUser);

        if (currentUser) {
          // Fetch Profile (Check Consent Status)
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data());
          }
        }

        // B. Fetch Event Details
        const eventDoc = await getDoc(doc(db, "events", id));
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() });
        } else {
          alert("Event not found!");
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // 🛠️ FIX 1: HANDLE CONSENT (The Loop Breaker)
  const handleAgreeToTerms = async () => {
    if (!user) return;

    try {
      setRegistering(true); // Show loading spinner
      const userRef = doc(db, "users", user.uid);

      // 1. Update Backend
      await updateDoc(userRef, {
        termsAccepted: true,
        updatedAt: serverTimestamp()
      });

      // 2. ⚡ FORCE UPDATE LOCAL STATE (This fixes the loop)
      // Hum React ko bata rahe hain: "Bhai maan le, ab true hai"
      setProfile(prev => ({ ...prev, termsAccepted: true }));
      
      // 3. Close Modal & Auto-Trigger Registration
      setShowConsentModal(false);
      
      // Optional: Agar direct register karwana hai accept karte hi:
      // handleIndividualRegistration(); 
      
      alert("Terms Accepted! You can now book your ticket.");

    } catch (error) {
      console.error("Consent Error:", error);
      alert("Failed to update terms. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  // 2. CHECK REQUIREMENTS BEFORE ACTION
  const checkRequirements = () => {
    if (!user) {
      alert("Please login first");
      navigate('/login');
      return false;
    }
    // Agar Profile load nahi hui ya Terms Accepted nahi hain -> Show Modal
    if (!profile || !profile.termsAccepted) {
      setShowConsentModal(true);
      return false; // Stop here
    }
    return true; // All good
  };

  // 3. INDIVIDUAL REGISTRATION
  const handleIndividualRegistration = async () => {
    if (!checkRequirements()) return; // Check Consent First

    try {
      setRegistering(true);
      // Using the new service we made earlier
      await registerForEvent(event.id, user, profile); 
      alert("🎉 Ticket Booked Successfully! Check your Email.");
      navigate('/tickets');
    } catch (error) {
      console.error("Booking Failed:", error);
      alert("Booking Failed: " + error.message);
    } finally {
      setRegistering(false);
    }
  };

  // 4. TEAM REGISTRATION HANDLER
  const handleTeamAction = async () => {
    if (!checkRequirements()) return;

    try {
      setRegistering(true);
      if (teamMode === 'create') {
        const res = await registerTeam(event.id, user, teamName, profile);
        alert(`Team Created! Code: ${res.teamCode}`);
      } else {
        await joinTeam(event.id, user, teamCode, profile);
        alert("Joined Team Successfully!");
      }
      navigate('/tickets');
    } catch (error) {
      alert(error.message);
    } finally {
      setRegistering(false);
      setShowTeamModal(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Event...</div>;
  if (!event) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* --- HEADER --- */}
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="h-48 bg-indigo-600 relative">
           {/* Placeholder for Event Image */}
           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
           <div className="absolute bottom-4 left-6 text-white">
             <h1 className="text-3xl font-bold">{event.title}</h1>
             <p className="opacity-90">{event.category} • {event.type}</p>
           </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center"><Calendar className="w-4 h-4 mr-2"/> {event.date}</div>
            <div className="flex items-center"><Clock className="w-4 h-4 mr-2"/> {event.time}</div>
            <div className="flex items-center"><MapPin className="w-4 h-4 mr-2"/> {event.location}</div>
          </div>

          <div className="prose max-w-none text-gray-700 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">About Event</h3>
            <p>{event.description}</p>
          </div>

          {/* --- ACTION BUTTONS --- */}
          <div className="flex flex-col sm:flex-row gap-3 border-t pt-6">
            {event.maxTeamSize > 1 ? (
              <button 
                onClick={() => { if(checkRequirements()) setShowTeamModal(true); }}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                Register as Team
              </button>
            ) : (
              <button 
                onClick={handleIndividualRegistration}
                disabled={registering}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {registering ? "Booking..." : "Book Individual Ticket"}
              </button>
            )}
            
            <button className="p-3 border rounded-xl hover:bg-gray-50">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL 1: CONSENT (Terms & Conditions) --- */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold">One-Time Consent</h3>
              <p className="text-gray-500 text-sm mt-1">Please agree to the rules to continue.</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 mb-6 h-32 overflow-y-auto">
              <ul className="list-disc pl-4 space-y-1">
                <li>I agree to follow the code of conduct.</li>
                <li>I understand tickets are non-transferable.</li>
                <li>I consent to photography during the event.</li>
                <li>I will carry my ID card to the venue.</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConsentModal(false)}
                className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleAgreeToTerms}
                disabled={registering}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
              >
                {registering ? "Updating..." : "I Agree & Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: TEAM SELECTION --- */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Team Registration</h3>
            
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
              <button 
                onClick={() => setTeamMode('create')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${teamMode === 'create' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
              >
                Create Team
              </button>
              <button 
                onClick={() => setTeamMode('join')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${teamMode === 'join' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
              >
                Join Team
              </button>
            </div>

            {teamMode === 'create' ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input 
                  type="text" 
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Code Blasters"
                />
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Code</label>
                <input 
                  type="text" 
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                  placeholder="e.g. A1B2C3"
                />
              </div>
            )}

            <button 
              onClick={handleTeamAction}
              disabled={registering}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
            >
              {registering ? "Processing..." : (teamMode === 'create' ? "Create & Register" : "Join & Register")}
            </button>
            <button 
              onClick={() => setShowTeamModal(false)}
              className="w-full mt-3 text-gray-500 text-sm hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
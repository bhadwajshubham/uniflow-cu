import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Calendar, MapPin, Clock, ArrowLeft, Share2, Shield, Check } from 'lucide-react';
import { registerForEvent, registerTeam, joinTeam } from '../services/registrationService';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  // Modals
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  
  // Consent Checkbox State (UI Logic)
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  // Team State
  const [teamMode, setTeamMode] = useState('create');
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        setUser(currentUser);

        if (currentUser) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data());
          }
        }

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

  // 🛠️ LOGIC: Handle Consent (Old UI + New Fix)
  const handleAgreeToTerms = async () => {
    if (!termsChecked || !privacyChecked) {
      alert("Please accept both Terms and Privacy Policy.");
      return;
    }

    try {
      setRegistering(true);
      const userRef = doc(db, "users", user.uid);

      // 1. Backend Update
      await updateDoc(userRef, {
        termsAccepted: true,
        updatedAt: serverTimestamp()
      });

      // 2. Local State Fix (Breaks the loop)
      setProfile(prev => ({ ...prev, termsAccepted: true }));
      
      setShowConsentModal(false);
      alert("Consent Recorded! You can now book your ticket.");

    } catch (error) {
      console.error("Consent Error:", error);
      alert("Failed. Try again.");
    } finally {
      setRegistering(false);
    }
  };

  const checkRequirements = () => {
    if (!user) {
      navigate('/login');
      return false;
    }
    if (!profile || !profile.termsAccepted) {
      setShowConsentModal(true);
      return false;
    }
    return true;
  };

  // Registration Handlers
  const handleIndividualRegistration = async () => {
    if (!checkRequirements()) return;
    try {
      setRegistering(true);
      await registerForEvent(event.id, user, profile);
      alert("🎉 Ticket Booked Successfully! Check Email.");
      navigate('/tickets');
    } catch (error) {
      alert("Booking Failed: " + error.message);
    } finally {
      setRegistering(false);
    }
  };

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

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!event) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* Header */}
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      {/* Event Card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="h-48 bg-indigo-600 relative">
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

          <div className="flex flex-col sm:flex-row gap-3 border-t pt-6">
            {event.maxTeamSize > 1 ? (
              <button onClick={() => { if(checkRequirements()) setShowTeamModal(true); }} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition">
                Register as Team
              </button>
            ) : (
              <button onClick={handleIndividualRegistration} disabled={registering} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                {registering ? "Booking..." : "Book Individual Ticket"}
              </button>
            )}
            <button className="p-3 border rounded-xl hover:bg-gray-50"><Share2 className="w-5 h-5 text-gray-600" /></button>
          </div>
        </div>
      </div>

      {/* 🛡️ OLD UI CONSENT MODAL (Recreated perfectly) */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex flex-col items-center text-center mb-6">
              <Shield className="w-12 h-12 text-indigo-600 mb-4 stroke-[1.5]" />
              <h3 className="text-2xl font-bold text-gray-900">Consent Required</h3>
              <p className="text-gray-500 text-sm mt-1">Please review and accept to continue</p>
            </div>

            <div className="space-y-4 mb-8">
              {/* Checkbox 1 */}
              <label className="flex items-start cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={termsChecked}
                    onChange={(e) => setTermsChecked(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm transition-all checked:border-indigo-600 checked:bg-indigo-600 hover:border-indigo-400"
                  />
                  <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                </div>
                <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  I agree to the <span className="font-semibold underline decoration-indigo-200 underline-offset-2">Terms & Conditions</span>
                </span>
              </label>

              {/* Checkbox 2 */}
              <label className="flex items-start cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={privacyChecked}
                    onChange={(e) => setPrivacyChecked(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm transition-all checked:border-indigo-600 checked:bg-indigo-600 hover:border-indigo-400"
                  />
                   <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                </div>
                <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  I agree to the <span className="font-semibold underline decoration-indigo-200 underline-offset-2">Privacy Policy</span>
                </span>
              </label>
            </div>

            <button 
              onClick={handleAgreeToTerms}
              disabled={!termsChecked || !privacyChecked || registering}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {registering ? (
                <span>Processing...</span>
              ) : (
                <>
                  <Check className="w-5 h-5" /> Accept & Continue
                </>
              )}
            </button>

            <button 
              onClick={() => setShowConsentModal(false)}
              className="w-full mt-4 text-gray-400 text-sm hover:text-gray-600 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Team Modal (Standard) */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Team Registration</h3>
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
              <button onClick={() => setTeamMode('create')} className={`flex-1 py-2 rounded-md text-sm font-medium ${teamMode === 'create' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>Create Team</button>
              <button onClick={() => setTeamMode('join')} className={`flex-1 py-2 rounded-md text-sm font-medium ${teamMode === 'join' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>Join Team</button>
            </div>
            {teamMode === 'create' ? (
              <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full border rounded-lg p-2.5 mb-6" placeholder="Team Name" />
            ) : (
              <input type="text" value={teamCode} onChange={(e) => setTeamCode(e.target.value)} className="w-full border rounded-lg p-2.5 mb-6 uppercase" placeholder="Team Code" />
            )}
            <button onClick={handleTeamAction} disabled={registering} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold">{registering ? "Processing..." : "Continue"}</button>
            <button onClick={() => setShowTeamModal(false)} className="w-full mt-3 text-gray-500 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
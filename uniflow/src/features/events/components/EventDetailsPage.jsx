import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Calendar, MapPin, Clock, ArrowLeft, Share2, Shield, Check, User, Phone, BookOpen } from 'lucide-react';
import { registerForEvent, registerTeam, joinTeam } from '../services/registrationService';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Data State
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  // Modals State
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); // New: Mandatory Profile
  const [showTeamModal, setShowTeamModal] = useState(false);
  
  // Consent Checkbox
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  // Profile Form State (For instant update)
  const [formData, setFormData] = useState({ rollNo: '', phone: '', department: '' });

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
            const userData = userDoc.data();
            setProfile(userData);
            // Pre-fill form if data exists
            setFormData({
              rollNo: userData.rollNo || '',
              phone: userData.phone || '',
              department: userData.department || ''
            });
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

  // 🛠️ CHECK: Is Profile Complete? (Excel Sheet Requirement)
  const isProfileComplete = () => {
    if (!profile) return false;
    return profile.rollNo && profile.phone && profile.department;
  };

  // 🛠️ CHECK: Requirements Pipeline
  const checkRequirements = () => {
    if (!user) {
      navigate('/login');
      return false;
    }
    
    // Step 1: Check Profile Completion
    if (!isProfileComplete()) {
      setShowProfileModal(true);
      return false;
    }

    // Step 2: Check Consent
    if (!profile.termsAccepted) {
      setShowConsentModal(true);
      return false;
    }

    return true;
  };

  // 💾 SAVE PROFILE (Inside Modal)
  const handleSaveProfile = async () => {
    if (!formData.rollNo || !formData.phone || !formData.department) {
      alert("Please fill all fields. Organizer needs this for records.");
      return;
    }
    
    try {
      setRegistering(true);
      const userRef = doc(db, "users", user.uid);
      
      const updatedData = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, updatedData);
      
      // Update Local State immediately
      setProfile(prev => ({ ...prev, ...formData }));
      setShowProfileModal(false);
      
      // Auto-trigger next step (Consent or Booking)
      if (!profile?.termsAccepted) {
        setShowConsentModal(true);
      } else {
        // Ready to book
      }
    } catch (error) {
      alert("Error saving profile: " + error.message);
    } finally {
      setRegistering(false);
    }
  };

  // 📝 HANDLE CONSENT + AUTO BOOKING (The Fix)
  const handleAgreeToTerms = async () => {
    if (!termsChecked || !privacyChecked) {
      alert("Please accept both checkboxes.");
      return;
    }

    try {
      setRegistering(true);
      const userRef = doc(db, "users", user.uid);

      // 1. Update Backend
      await updateDoc(userRef, {
        termsAccepted: true,
        updatedAt: serverTimestamp()
      });

      // 2. Update Local State
      const updatedProfile = { ...profile, termsAccepted: true };
      setProfile(updatedProfile);
      setShowConsentModal(false);

      // 3. ⚡ AUTO-BOOK TICKET IMMEDIATELY (No "Already Booked" error)
      if (event.maxTeamSize > 1) {
        setShowTeamModal(true); // Teams need one more step
      } else {
        await executeIndividualBooking(updatedProfile); // Pass updated profile
      }

    } catch (error) {
      console.error("Consent Error:", error);
      alert("Something went wrong. Try again.");
    } finally {
      setRegistering(false);
    }
  };

  // Separated Booking Logic for re-use
  const executeIndividualBooking = async (currentProfile) => {
    try {
      await registerForEvent(event.id, user, currentProfile);
      alert("🎉 Ticket Booked Successfully! Check your Email.");
      navigate('/tickets');
    } catch (error) {
      alert("Booking Failed: " + error.message);
    }
  };

  const handleIndividualClick = () => {
    if (checkRequirements()) {
      executeIndividualBooking(profile);
    }
  };

  const handleTeamClick = () => {
    if (checkRequirements()) {
      setShowTeamModal(true);
    }
  };

  const handleTeamSubmit = async () => {
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
    <div className="max-w-4xl mx-auto p-4 pb-32">
      {/* 🔙 Back Button */}
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 mb-4 hover:text-indigo-600 transition">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back
      </button>

      {/* 🖼️ Hero Section (Improved UI) */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
        <div className="h-56 sm:h-72 bg-gradient-to-r from-indigo-600 to-purple-700 relative">
           <div className="absolute inset-0 bg-black/20" />
           <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white bg-gradient-to-t from-black/80 to-transparent">
             <span className="bg-white/20 backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full border border-white/30 uppercase tracking-wide">
               {event.category}
             </span>
             <h1 className="text-3xl sm:text-4xl font-extrabold mt-3 shadow-sm leading-tight">{event.title}</h1>
             <div className="flex items-center gap-4 mt-3 opacity-90 text-sm font-medium">
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5"/> {event.date}</span>
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5"/> {event.location}</span>
             </div>
           </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="prose max-w-none text-gray-600 leading-relaxed mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-indigo-600"/> About Event
            </h3>
            <p>{event.description}</p>
          </div>

          {/* 🔘 Action Bar (Fixed Responsiveness) */}
          <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-100 pt-6">
            <div className="flex-1">
              {event.maxTeamSize > 1 ? (
                <button 
                  onClick={handleTeamClick}
                  disabled={registering}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-indigo-200 shadow-lg hover:bg-indigo-700 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:scale-100"
                >
                  {registering ? "Processing..." : "Register as Team"}
                </button>
              ) : (
                <button 
                  onClick={handleIndividualClick}
                  disabled={registering}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-indigo-200 shadow-lg hover:bg-indigo-700 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:scale-100"
                >
                  {registering ? "Booking..." : "Book Individual Ticket"}
                </button>
              )}
            </div>
            
            {/* Share Button (Responsive) */}
            <button className="flex items-center justify-center sm:w-auto w-full px-6 py-4 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition">
              <Share2 className="w-5 h-5 mr-2" /> Share
            </button>
          </div>
        </div>
      </div>

      {/* 🚨 MODAL 1: MISSING PROFILE INFO (Mandatory) */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Complete Your Profile</h3>
              <p className="text-gray-500 text-sm mt-1">Organizer requires these details for entry.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">University Roll No *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={formData.rollNo}
                    onChange={(e) => setFormData({...formData, rollNo: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. 211099XXXX"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Department/Course *</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. B.Tech CSE"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSaveProfile}
              disabled={registering}
              className="w-full mt-6 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition"
            >
              {registering ? "Saving..." : "Save & Continue"}
            </button>
          </div>
        </div>
      )}

      {/* 🛡️ MODAL 2: CONSENT (With Links Fixed) */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in zoom-in-95">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-6">
              <Shield className="w-12 h-12 text-indigo-600 mb-4 stroke-[1.5] mx-auto" />
              <h3 className="text-2xl font-bold text-gray-900">Final Step</h3>
              <p className="text-gray-500 text-sm mt-1">Accept terms to book your ticket immediately.</p>
            </div>

            <div className="space-y-4 mb-8">
              <label className="flex items-start cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 text-sm text-gray-600">
                  I agree to the <a href="#" className="text-indigo-600 font-semibold hover:underline" onClick={e => e.stopPropagation()}>Terms & Conditions</a>
                </span>
              </label>

              <label className="flex items-start cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={privacyChecked}
                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 text-sm text-gray-600">
                  I agree to the <a href="#" className="text-indigo-600 font-semibold hover:underline" onClick={e => e.stopPropagation()}>Privacy Policy</a>
                </span>
              </label>
            </div>

            <button 
              onClick={handleAgreeToTerms}
              disabled={!termsChecked || !privacyChecked || registering}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {registering ? "Booking Ticket..." : "Agree & Book Ticket"}
            </button>
          </div>
        </div>
      )}

      {/* 👥 MODAL 3: TEAM INFO */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Team Registration</h3>
            
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
              <button onClick={() => setTeamMode('create')} className={`flex-1 py-2 rounded-md text-sm font-medium transition ${teamMode === 'create' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>Create Team</button>
              <button onClick={() => setTeamMode('join')} className={`flex-1 py-2 rounded-md text-sm font-medium transition ${teamMode === 'join' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>Join Team</button>
            </div>

            {teamMode === 'create' ? (
              <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full border rounded-lg p-3 mb-6 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter Team Name" />
            ) : (
              <input type="text" value={teamCode} onChange={(e) => setTeamCode(e.target.value)} className="w-full border rounded-lg p-3 mb-6 uppercase focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter Team Code" />
            )}

            <button 
              onClick={handleTeamSubmit}
              disabled={registering}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition"
            >
              {registering ? "Processing..." : "Confirm & Register"}
            </button>
            <button onClick={() => setShowTeamModal(false)} className="w-full mt-3 text-gray-500 text-sm hover:text-gray-800">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
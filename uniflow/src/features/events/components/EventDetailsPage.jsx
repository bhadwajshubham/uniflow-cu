import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Calendar, MapPin, Clock, ArrowLeft, Share2, Shield, User, Phone, BookOpen, Loader2 } from 'lucide-react';
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
  const [showProfileModal, setShowProfileModal] = useState(false); 
  const [showTeamModal, setShowTeamModal] = useState(false);
  
  // Consent Checkbox
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  // 📝 Profile Form State (Updated with Branch Logic)
  const [formData, setFormData] = useState({ 
     rollNo: '', 
     phone: '', 
     branch: 'B.E. (CSE)', 
     customBranch: '',
     semester: '1st' 
  });

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
            
            // Logic to Pre-fill Form (Handle 'Others')
            const isStandard = ['B.E. (CSE)', 'B.E. (CSE-AI)', 'B.E. (ECE)', 'B.E. (ME)'].includes(userData.branch);
            
            setFormData({
              rollNo: userData.rollNo || '',
              phone: userData.phone || '',
              branch: isStandard ? userData.branch : (userData.branch ? 'Others' : 'B.E. (CSE)'),
              customBranch: isStandard ? '' : userData.branch || '',
              semester: userData.semester || '1st'
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
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [id, navigate]);

  // 🛠️ CHECK REQUIREMENTS
  const checkRequirements = () => {
    if (!user) { navigate('/login'); return false; }
    
    // Check if critical fields exist
    if (!profile?.rollNo || !profile?.phone || !profile?.branch) {
      setShowProfileModal(true);
      return false;
    }

    if (!profile.termsAccepted) {
      setShowConsentModal(true);
      return false;
    }
    return true;
  };

  // 💾 SAVE PROFILE (With Validation & Dropdowns)
  const handleSaveProfile = async () => {
    // 1. Validation
    if (formData.phone.length !== 10) { alert("Phone number must be exactly 10 digits."); return; }
    if (formData.rollNo.length < 5) { alert("Enter a valid Roll Number."); return; }
    
    // 2. Branch Logic
    const finalBranch = formData.branch === 'Others' ? formData.customBranch.trim() : formData.branch;
    if (!finalBranch) { alert("Please specify your Branch/Course."); return; }

    try {
      setRegistering(true);
      const userRef = doc(db, "users", user.uid);
      
      const updatedData = {
        rollNo: formData.rollNo.toUpperCase(),
        phone: formData.phone,
        branch: finalBranch,
        semester: formData.semester,
        updatedAt: serverTimestamp(),
        isProfileComplete: true
      };

      await updateDoc(userRef, updatedData);
      
      // Update Local State & Close Modal
      setProfile(prev => ({ ...prev, ...updatedData }));
      setShowProfileModal(false);
      
      // Auto-trigger next step
      if (!profile?.termsAccepted) { setShowConsentModal(true); }

    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setRegistering(false);
    }
  };

  // 📝 HANDLE CONSENT + AUTO BOOKING
  const handleAgreeToTerms = async () => {
    if (!termsChecked || !privacyChecked) { alert("Please accept both checkboxes."); return; }
    try {
      setRegistering(true);
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { termsAccepted: true, updatedAt: serverTimestamp() });
      setProfile(prev => ({ ...prev, termsAccepted: true }));
      setShowConsentModal(false);
      
      if (event.maxTeamSize > 1) setShowTeamModal(true);
      else executeIndividualBooking();

    } catch (error) { alert("Error: " + error.message); } 
    finally { setRegistering(false); }
  };

  const executeIndividualBooking = async () => {
    try {
      setRegistering(true);
      await registerForEvent(event.id, user, profile);
      alert("🎉 Ticket Booked! Check Email.");
      navigate('/tickets');
    } catch (error) { alert("Failed: " + error.message); }
    finally { setRegistering(false); }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!event) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-32">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 mb-4"><ArrowLeft className="w-5 h-5 mr-2" /> Back</button>
      
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
        <div className="h-56 sm:h-72 bg-gradient-to-r from-indigo-600 to-purple-700 relative">
           <div className="absolute inset-0 bg-black/20" />
           <div className="absolute bottom-0 left-0 right-0 p-6 text-white bg-gradient-to-t from-black/80 to-transparent">
             <span className="bg-white/20 backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full border border-white/30 uppercase">{event.category}</span>
             <h1 className="text-3xl font-extrabold mt-3">{event.title}</h1>
             <div className="flex gap-4 mt-3 opacity-90 text-sm"><span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/>{event.date}</span><span className="flex items-center"><MapPin className="w-4 h-4 mr-1"/>{event.location}</span></div>
           </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed mb-8">{event.description}</p>
          <div className="flex gap-4 pt-6 border-t">
            {event.maxTeamSize > 1 ? (
              <button onClick={() => checkRequirements() && setShowTeamModal(true)} disabled={registering} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50">Register as Team</button>
            ) : (
              <button onClick={() => checkRequirements() && executeIndividualBooking()} disabled={registering} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50">Book Ticket</button>
            )}
            <button className="px-6 py-4 border-2 rounded-xl font-semibold text-gray-600 hover:bg-gray-50"><Share2 className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {/* 🚨 MODAL 1: COMPLETE PROFILE (Fixed with Dropdowns & Validation) */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><User className="w-6 h-6 text-red-600" /></div>
              <h3 className="text-xl font-bold text-gray-900">Complete Profile</h3>
              <p className="text-gray-500 text-sm mt-1">Required for entry pass generation.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                    <div className="relative"><Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                    <input type="text" value={formData.phone} onChange={e => { if(/^\d{0,10}$/.test(e.target.value)) setFormData({...formData, phone: e.target.value}) }} className="w-full pl-9 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="10 Digits" />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Roll No</label>
                    <div className="relative"><User className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                    <input type="text" value={formData.rollNo} onChange={e => { if(/^[a-zA-Z0-9]*$/.test(e.target.value)) setFormData({...formData, rollNo: e.target.value}) }} className="w-full pl-9 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 211099" />
                    </div>
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Branch</label>
                 <select value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none bg-white appearance-none">
                    <option>B.E. (CSE)</option><option>B.E. (CSE-AI)</option><option>B.E. (ECE)</option><option>B.E. (ME)</option><option>Others</option>
                 </select>
                 {formData.branch === 'Others' && (
                    <input type="text" value={formData.customBranch} onChange={e => setFormData({...formData, customBranch: e.target.value})} className="w-full mt-2 p-2.5 border rounded-lg outline-none" placeholder="Specify Branch" />
                 )}
              </div>

              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Semester</label>
                 <select value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none bg-white appearance-none">
                    {['1st','2nd','3rd','4th','5th','6th','7th','8th'].map(n => <option key={n}>{n}</option>)}
                 </select>
              </div>
            </div>

            <button onClick={handleSaveProfile} disabled={registering} className="w-full mt-6 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition flex justify-center">
              {registering ? <Loader2 className="animate-spin w-5 h-5"/> : "Save & Continue"}
            </button>
          </div>
        </div>
      )}

      {/* Consent & Team Modals */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-8 max-w-sm w-full">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Shield className="w-6 h-6 text-indigo-600"/> Final Consent</h3>
              <div className="space-y-3 mb-6">
                 <label className="flex gap-3 cursor-pointer"><input type="checkbox" checked={termsChecked} onChange={e => setTermsChecked(e.target.checked)} className="mt-1"/> <span className="text-sm">I agree to <a href="#" className="text-indigo-600 font-bold" onClick={e=>e.stopPropagation()}>Terms</a></span></label>
                 <label className="flex gap-3 cursor-pointer"><input type="checkbox" checked={privacyChecked} onChange={e => setPrivacyChecked(e.target.checked)} className="mt-1"/> <span className="text-sm">I agree to <a href="#" className="text-indigo-600 font-bold" onClick={e=>e.stopPropagation()}>Privacy</a></span></label>
              </div>
              <button onClick={handleAgreeToTerms} disabled={!termsChecked || !privacyChecked} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">Agree & Book</button>
           </div>
        </div>
      )}
      
      {showTeamModal && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
               <h3 className="text-xl font-bold mb-4">Team Setup</h3>
               <div className="flex bg-gray-100 p-1 rounded-lg mb-4"><button onClick={()=>setTeamMode('create')} className={`flex-1 py-2 rounded ${teamMode==='create'?'bg-white shadow':''}`}>Create</button><button onClick={()=>setTeamMode('join')} className={`flex-1 py-2 rounded ${teamMode==='join'?'bg-white shadow':''}`}>Join</button></div>
               {teamMode==='create' ? <input value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="Team Name" className="w-full border p-3 rounded-lg mb-4"/> : <input value={teamCode} onChange={e=>setTeamCode(e.target.value)} placeholder="Team Code" className="w-full border p-3 rounded-lg mb-4 uppercase"/>}
               <button onClick={async()=>{ setRegistering(true); try { if(teamMode==='create') await registerTeam(event.id,user,teamName,profile); else await joinTeam(event.id,user,teamCode,profile); navigate('/tickets'); } catch(e){alert(e.message)} finally{setRegistering(false)} }} disabled={registering} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Confirm</button>
               <button onClick={()=>setShowTeamModal(false)} className="w-full mt-2 text-gray-500">Cancel</button>
            </div>
         </div>
      )}
    </div>
  );
};

export default EventDetails;
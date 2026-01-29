import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Calendar, MapPin, Clock, ArrowLeft, Share2, Shield, User, Phone, Loader2, QrCode, X } from 'lucide-react';

// 👇 CORRECTED IMPORT PATH (Yeh ab sahi file uthayega)
import { registerForEvent, registerTeam, joinTeam } from '../services/registrationService';

const EventDetailsPage = () => {
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

  // 📝 Profile Form State
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
          // alert("Event not found!");
          // navigate('/dashboard');
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

  // 💾 SAVE PROFILE
  const handleSaveProfile = async () => {
    if (formData.phone.length !== 10) { alert("Phone number must be exactly 10 digits."); return; }
    if (formData.rollNo.length < 5) { alert("Enter a valid Roll Number."); return; }
    
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

      await setDoc(userRef, updatedData, { merge: true });
      
      setProfile(prev => ({ ...prev, ...updatedData }));
      setShowProfileModal(false);
      
      if (!profile?.termsAccepted) { setShowConsentModal(true); }

    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setRegistering(false);
    }
  };

  // 📝 HANDLE CONSENT
  const handleAgreeToTerms = async () => {
    if (!termsChecked || !privacyChecked) { alert("Please accept both checkboxes."); return; }
    try {
      setRegistering(true);
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { termsAccepted: true, updatedAt: serverTimestamp() }, { merge: true });
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
      navigate('/my-tickets');
    } catch (error) { alert("Failed: " + error.message); }
    finally { setRegistering(false); }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!event) return <div className="p-10 text-center text-red-500">Event Not Found</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-32 pt-20">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 mb-4"><ArrowLeft className="w-5 h-5 mr-2" /> Back</button>
      
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
        <div className="h-56 sm:h-72 bg-gradient-to-r from-indigo-600 to-purple-700 relative">
           <div className="absolute inset-0 bg-black/20" />
           <img src={event.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80'} alt={event.title} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"/>
           
           <div className="absolute bottom-0 left-0 right-0 p-6 text-white bg-gradient-to-t from-black/80 to-transparent">
             <span className="bg-white/20 backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full border border-white/30 uppercase">{event.category}</span>
             <h1 className="text-3xl font-extrabold mt-3">{event.title}</h1>
             <div className="flex gap-4 mt-3 opacity-90 text-sm"><span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/>{new Date(event.date).toLocaleDateString()}</span><span className="flex items-center"><MapPin className="w-4 h-4 mr-1"/>{event.venue || event.location}</span></div>
           </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed mb-8">{event.description}</p>
          <div className="flex gap-4 pt-6 border-t">
            {event.maxTeamSize > 1 ? (
              <button onClick={() => checkRequirements() && setShowTeamModal(true)} disabled={registering} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 flex justify-center">{registering ? <Loader2 className="animate-spin"/> : "Register as Team"}</button>
            ) : (
              <button onClick={() => checkRequirements() && executeIndividualBooking()} disabled={registering} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 flex justify-center">{registering ? <Loader2 className="animate-spin"/> : "Book Ticket"}</button>
            )}
            <button className="px-6 py-4 border-2 rounded-xl font-semibold text-gray-600 hover:bg-gray-50"><Share2 className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {/* 🚨 MODAL 1: COMPLETE PROFILE */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><User className="w-6 h-6 text-red-600" /></div>
              <h3 className="text-xl font-bold text-gray-900">Complete Profile</h3>
            </div>
            <div className="space-y-4">
              <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone" className="w-full p-3 border rounded-xl"/>
              <input value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} placeholder="Roll No" className="w-full p-3 border rounded-xl"/>
              <select value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} className="w-full p-3 border rounded-xl"><option>B.E. (CSE)</option><option>Others</option></select>
              {formData.branch === 'Others' && <input value={formData.customBranch} onChange={e => setFormData({...formData, customBranch: e.target.value})} placeholder="Specify Branch" className="w-full p-3 border rounded-xl"/>}
            </div>
            <button onClick={handleSaveProfile} disabled={registering} className="w-full mt-6 bg-black text-white py-3 rounded-xl font-bold">Save</button>
          </div>
        </div>
      )}

      {/* Consent & Team Modals */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-8 max-w-sm w-full">
             <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Shield className="w-6 h-6 text-indigo-600"/> Final Consent</h3>
             <div className="space-y-3 mb-6">
                <label className="flex gap-3 cursor-pointer"><input type="checkbox" checked={termsChecked} onChange={e => setTermsChecked(e.target.checked)}/> I agree to Terms</label>
                <label className="flex gap-3 cursor-pointer"><input type="checkbox" checked={privacyChecked} onChange={e => setPrivacyChecked(e.target.checked)}/> I agree to Privacy</label>
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
               <button onClick={async()=>{ setRegistering(true); try { if(teamMode==='create') await registerTeam(event.id,user,teamName,profile); else await joinTeam(event.id,user,teamCode,profile); navigate('/my-tickets'); } catch(e){alert(e.message)} finally{setRegistering(false)} }} disabled={registering} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Confirm</button>
               <button onClick={()=>setShowTeamModal(false)} className="w-full mt-2 text-gray-500">Cancel</button>
            </div>
         </div>
      )}
    </div>
  );
};

export default EventDetailsPage;
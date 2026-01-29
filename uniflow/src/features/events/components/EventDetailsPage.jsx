import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Calendar, MapPin, Clock, ArrowLeft, Share2, Shield, User, Phone, Loader2, QrCode, X, CheckCircle } from 'lucide-react';

// ✅ CORRECT IMPORT PATH
import { registerForEvent, registerTeam, joinTeam } from '../services/registrationService';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); 
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  
  // Consent Checkbox
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  const [formData, setFormData] = useState({ 
     rollNo: '', 
     phone: '', 
     branch: 'B.E. (CSE)', 
     customBranch: '', 
     semester: '1st' 
  });

  const [teamMode, setTeamMode] = useState('create');
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');

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
        if (eventDoc.exists()) setEvent({ id: eventDoc.id, ...eventDoc.data() });
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [id, navigate]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: event.title, url }); } catch (err) {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  };

  const checkRequirements = () => {
    if (!user) { navigate('/login'); return false; }
    if (!profile?.rollNo || !profile?.phone || !profile?.branch) { setShowProfileModal(true); return false; }
    if (!profile.termsAccepted) { setShowConsentModal(true); return false; }
    return true;
  };

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
    } catch (error) { alert("Error: " + error.message); } finally { setRegistering(false); }
  };

  // ✅ HANDLER UPDATED TO MATCH UI
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
      
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <div className={`relative h-56 sm:h-72 w-full ${!event.image ? 'bg-gradient-to-r from-indigo-600 to-purple-700' : ''}`}>
           {event.image && (
             <>
               <img src={event.image} alt={event.title} className="w-full h-full object-cover"/>
               <div className="absolute inset-0 bg-black/40"></div>
             </>
           )}
           <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button onClick={() => setShowQRModal(true)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition"><QrCode className="w-6 h-6" /></button>
              <button onClick={handleShare} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition"><Share2 className="w-6 h-6" /></button>
           </div>
           <div className="absolute bottom-0 left-0 right-0 p-6 text-white bg-gradient-to-t from-black/80 to-transparent">
             <span className="bg-white/20 backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full border border-white/30 uppercase">{event.category}</span>
             <h1 className="text-3xl font-extrabold mt-3">{event.title}</h1>
             <div className="flex gap-4 mt-3 opacity-90 text-sm">
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/>{new Date(event.date).toLocaleDateString()}</span>
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1"/>{event.venue || event.location}</span>
             </div>
           </div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">{event.description}</p>
          <div className="flex gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            {event.maxTeamSize > 1 ? (
              <button onClick={() => checkRequirements() && setShowTeamModal(true)} disabled={registering} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 flex justify-center">{registering ? <Loader2 className="animate-spin"/> : "Register as Team"}</button>
            ) : (
              <button onClick={() => checkRequirements() && executeIndividualBooking()} disabled={registering} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 flex justify-center">{registering ? <Loader2 className="animate-spin"/> : "Book Ticket"}</button>
            )}
          </div>
        </div>
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-center mb-4 dark:text-white">Complete Profile</h3>
            <div className="space-y-3">
                 <input value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})} placeholder="Phone (10 digits)" className="w-full p-3 border rounded-xl bg-zinc-50 text-zinc-900"/>
                 <input value={formData.rollNo} onChange={e=>setFormData({...formData, rollNo:e.target.value})} placeholder="Roll No" className="w-full p-3 border rounded-xl bg-zinc-50 text-zinc-900"/>
                 <select value={formData.branch} onChange={e=>setFormData({...formData, branch:e.target.value})} className="w-full p-3 border rounded-xl bg-zinc-50 text-zinc-900"><option>B.E. (CSE)</option><option>Others</option></select>
                 {formData.branch==='Others' && <input value={formData.customBranch} onChange={e=>setFormData({...formData, customBranch:e.target.value})} placeholder="Specify Branch" className="w-full p-3 border rounded-xl bg-zinc-50 text-zinc-900"/>}
            </div>
            <button onClick={handleSaveProfile} disabled={registering} className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl font-bold">Save</button>
          </div>
        </div>
      )}

      {/* 🚀 FIXED CONSENT MODAL - SAME AS USER PROFILE */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in zoom-in-95">
           <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full border border-zinc-200 dark:border-zinc-800 text-center shadow-2xl">
             
             {/* Centered Shield Icon (Matches Screenshots) */}
             <Shield className="w-14 h-14 text-indigo-600 mx-auto mb-4" />
             
             <h3 className="text-2xl font-extrabold mb-2 dark:text-white">Consent Required</h3>
             <p className="text-zinc-500 text-sm mb-6">Please review and accept to continue</p>
             
             <div className="text-left space-y-3 mb-6 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700">
                <label className="flex gap-3 cursor-pointer dark:text-gray-300 items-center">
                    <input type="checkbox" checked={termsChecked} onChange={e => setTermsChecked(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded"/> 
                    <span className="text-sm font-medium">I agree to <a href="/terms" target="_blank" className="text-indigo-600 font-bold underline" onClick={e=>e.stopPropagation()}>Terms & Conditions</a></span>
                </label>
                <label className="flex gap-3 cursor-pointer dark:text-gray-300 items-center">
                    <input type="checkbox" checked={privacyChecked} onChange={e => setPrivacyChecked(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded"/> 
                    <span className="text-sm font-medium">I agree to <a href="/privacy" target="_blank" className="text-indigo-600 font-bold underline" onClick={e=>e.stopPropagation()}>Privacy Policy</a></span>
                </label>
             </div>
             
             <button 
                onClick={handleAgreeToTerms} 
                disabled={!termsChecked || !privacyChecked} 
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
             >
                <CheckCircle className="w-5 h-5" /> Accept & Continue
             </button>
           </div>
        </div>
      )}

      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-2xl text-center max-w-xs w-full relative">
             <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 p-2 bg-zinc-100 rounded-full text-zinc-500 hover:bg-zinc-200"><X className="w-5 h-5" /></button>
             <h3 className="text-lg font-bold text-zinc-900 mb-1">Scan to Book</h3>
             <div className="bg-white p-2 rounded-xl border-2 border-dashed border-indigo-200 inline-block mt-4">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.href}&color=4f46e5`} alt="Event QR" className="w-48 h-48 object-contain"/>
             </div>
          </div>
        </div>
      )}
      
      {showTeamModal && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full">
               <h3 className="text-xl font-bold mb-4 dark:text-white">Team Setup</h3>
               <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg mb-4"><button onClick={()=>setTeamMode('create')} className={`flex-1 py-2 rounded ${teamMode==='create'?'bg-white shadow text-black':'text-gray-500'}`}>Create</button><button onClick={()=>setTeamMode('join')} className={`flex-1 py-2 rounded ${teamMode==='join'?'bg-white shadow text-black':'text-gray-500'}`}>Join</button></div>
               {teamMode==='create' ? <input value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="Team Name" className="w-full border p-3 rounded-lg mb-4 bg-zinc-50 text-zinc-900"/> : <input value={teamCode} onChange={e=>setTeamCode(e.target.value)} placeholder="Team Code" className="w-full border p-3 rounded-lg mb-4 uppercase bg-zinc-50 text-zinc-900"/>}
               <button onClick={async()=>{ setRegistering(true); try { if(teamMode==='create') await registerTeam(event.id,user,teamName,profile); else await joinTeam(event.id,user,teamCode,profile); navigate('/my-tickets'); } catch(e){alert(e.message)} finally{setRegistering(false)} }} disabled={registering} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Confirm</button>
               <button onClick={()=>setShowTeamModal(false)} className="w-full mt-2 text-gray-500">Cancel</button>
            </div>
         </div>
      )}
    </div>
  );
};

export default EventDetailsPage;
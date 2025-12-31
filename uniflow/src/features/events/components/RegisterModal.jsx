import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, User, Loader2, ArrowRight, ShieldCheck, 
  Hash, Smartphone, Ticket, CheckCircle
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore'; // Import for checking registration
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { registerForEvent, registerTeam, joinTeam } from '../services/registrationService';
import UserProfile from '../../auth/components/UserProfile';

const RegisterModal = ({ event, onClose, isOpen }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 🆕 STATE: To track registration status
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // For confetti/success screen

  // Form States
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [step, setStep] = useState('form'); 
  const [mode, setMode] = useState('solo');
  const [studentData, setStudentData] = useState({
    rollNo: '', phone: '', residency: '', group: '', branch: '', showPublicly: true
  });

  const isTeamEvent = event?.type === 'team' || event?.participationType === 'team';

  // 1. CHECK REGISTRATION ON OPEN
  useEffect(() => {
    const checkRegistration = async () => {
      if (user && event && isOpen) {
        try {
          const regRef = doc(db, 'registrations', `${event.id}_${user.uid}`);
          const regSnap = await getDoc(regRef);
          if (regSnap.exists()) {
            setIsAlreadyRegistered(true);
          }
        } catch (err) {
          console.error("Check Error", err);
        }
      }
    };
    checkRegistration();
  }, [user, event, isOpen]);

  // Reset/Init
  useEffect(() => {
    if (isTeamEvent) { setStep('choice'); setMode(null); } 
    else { setStep('form'); setMode('solo'); }
  }, [isTeamEvent, isOpen]); 

  // Auto-fill Profile
  useEffect(() => {
    if (profile) {
      setStudentData(prev => ({
        ...prev,
        rollNo: profile.rollNo || '',
        phone: profile.phone || '',
        branch: profile.branch || '',
        group: profile.group || '',
        residency: profile.residency || ''
      }));
    }
  }, [profile]);

  if (!isOpen || !event) return null;

  const isProfileComplete = profile?.rollNo && profile?.phone && profile?.branch && profile?.residency;

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'solo') await registerForEvent(event.id, user, studentData);
      else if (mode === 'create_team') await registerTeam(event.id, user, teamName, studentData);
      else if (mode === 'join_team') await joinTeam(event.id, user, teamCode, studentData);
      
      // 🆕 SUCCESS STATE instead of closing immediately
      setIsSuccess(true);
      setIsAlreadyRegistered(true); // Prevent re-submission
    } catch (error) {
      alert("❌ " + (error.message || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  // 2. 🛡️ VIEW TICKET STATE (If Success or Already Registered)
  if (isAlreadyRegistered || isSuccess) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-center p-8 relative">
           
           {/* Confetti Animation (CSS based) */}
           {isSuccess && (
             <div className="absolute inset-0 pointer-events-none overflow-hidden">
               <div className="absolute top-0 left-1/2 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
               <div className="absolute top-10 left-1/4 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-75"></div>
               <div className="absolute top-5 right-1/4 w-2 h-2 bg-green-500 rounded-full animate-ping delay-150"></div>
             </div>
           )}

           <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 animate-in zoom-in duration-500">
             <CheckCircle className="w-10 h-10" />
           </div>
           
           <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter mb-2">
             {isSuccess ? "Welcome Aboard!" : "Already Onboard!"}
           </h2>
           <p className="text-zinc-500 font-medium text-sm mb-8">
             Your pass for <span className="font-bold text-indigo-600">{event.title}</span> has been secured.
           </p>
           
           <div className="space-y-3">
             <button 
               onClick={() => { onClose(); navigate('/my-tickets'); }}
               className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               <Ticket className="w-4 h-4" /> View My Pass
             </button>
             <button onClick={onClose} className="text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-600">
               Close
             </button>
           </div>
        </div>
      </div>
    );
  }

  // 3. BLOCKING UI (Profile Missing)
  if (!isProfileComplete) {
    return (
      <>
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-center p-8">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
               <ShieldCheck className="w-8 h-8" />
             </div>
             <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter mb-2">Identity Required</h2>
             <p className="text-zinc-500 font-medium text-sm mb-8">
               Please update your profile details to proceed.
             </p>
             <button onClick={() => setShowProfileModal(true)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all">
               Update Profile
             </button>
             <button onClick={onClose} className="mt-4 text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-600">
               Cancel
             </button>
          </div>
        </div>
        <UserProfile isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      </>
    );
  }

  // 4. REGISTRATION FORM (Standard)
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-black/40 text-center relative">
          <div className="w-full">
            <h2 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic">Entry Portal</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{event.title}</p>
          </div>
          <button onClick={onClose} className="absolute right-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"><X className="h-5 w-5 text-zinc-500" /></button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {step === 'choice' ? (
             /* ... (Mode Selection Buttons - Same as before) ... */
             <div className="space-y-4">
               <button onClick={() => { setMode('solo'); setStep('form'); }} className="w-full p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] hover:border-indigo-500 transition-all group flex items-center gap-4 text-left shadow-sm">
                 <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center"><User className="h-6 w-6" /></div>
                 <div className="flex-1"><h3 className="font-black text-sm uppercase dark:text-white">Individual</h3></div>
                 <ArrowRight className="h-4 w-4 text-zinc-300" />
               </button>
               {/* Add Team Buttons here if needed */}
             </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex gap-3 shadow-sm">
                 <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                 <p className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase leading-tight">
                    IDENTITY VERIFIED: {studentData.rollNo}
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-4 opacity-70 pointer-events-none">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400">Roll No</label>
                    <input readOnly value={studentData.rollNo} className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-xs dark:text-white" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400">Residency</label>
                    <input readOnly value={studentData.residency} className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-xs dark:text-white" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input required type="tel" pattern="\d{10}" className="w-full pl-10 pr-4 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold dark:text-white outline-none"
                      value={studentData.phone} onChange={e => setStudentData({...studentData, phone: e.target.value})} />
                  </div>
                  <input required type="text" placeholder="Group" className="w-full px-4 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold dark:text-white outline-none"
                    value={studentData.group} onChange={e => setStudentData({...studentData, group: e.target.value})} />
              </div>

              <button type="submit" disabled={loading} className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto h-4 w-4" /> : 'Confirm Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
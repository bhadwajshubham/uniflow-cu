import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, User, Loader2, ArrowRight, ShieldCheck, 
  Ticket, CheckCircle, AlertTriangle
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { registerForEvent, registerTeam, joinTeam } from '../services/registrationService';
import UserProfile from '../../auth/components/UserProfile';

const RegisterModal = ({ event, onClose, isOpen }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form States
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [step, setStep] = useState('form'); 
  const [mode, setMode] = useState('solo');
  const [customAnswers, setCustomAnswers] = useState({});

  const isTeamEvent = event?.type === 'team' || event?.teamSize > 1;

  // Check Registration
  useEffect(() => {
    const checkRegistration = async () => {
      if (user && event && isOpen) {
        try {
          const regRef = doc(db, 'tickets', `${event.id}_${user.uid}`);
          const regSnap = await getDoc(regRef);
          if (regSnap.exists()) setIsAlreadyRegistered(true);
        } catch (err) { console.error("Check Error", err); }
      }
    };
    checkRegistration();
  }, [user, event, isOpen]);

  // Init
  useEffect(() => {
    if (isOpen) {
        if (isTeamEvent) { setStep('choice'); setMode(null); } 
        else { setStep('form'); setMode('solo'); }
    }
  }, [isTeamEvent, isOpen]); 

  if (!isOpen || !event) return null;

  // 🔥 STRICT PROFILE CHECK
  const isProfileComplete = 
      profile?.userName &&
      profile?.rollNo &&
      (profile?.phoneNumber || profile?.phone) &&
      profile?.branch &&
      profile?.residency &&
      profile?.group;

  const handleCustomAnswerChange = (qId, value) => {
    setCustomAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Explicitly pass data (though service handles fallbacks now)
    const finalData = {
        ...profile,
        customAnswers: customAnswers
    };

    try {
      if (mode === 'solo') await registerForEvent(event.id, user, finalData);
      else if (mode === 'create_team') await registerTeam(event.id, user, teamName, finalData);
      else if (mode === 'join_team') await joinTeam(event.id, user, teamCode, finalData);
      
      setIsSuccess(true);
      setIsAlreadyRegistered(true);
    } catch (error) {
      alert("❌ " + (error.message || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS / ALREADY REGISTERED UI
  if (isAlreadyRegistered || isSuccess) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] p-8 text-center border dark:border-zinc-800">
           <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 animate-in zoom-in duration-500"><CheckCircle className="w-10 h-10" /></div>
           <h2 className="text-2xl font-black dark:text-white uppercase italic mb-2">{isSuccess ? "Welcome Aboard!" : "Already Onboard!"}</h2>
           <p className="text-zinc-500 text-sm mb-8">Ticket confirmed for <span className="font-bold text-indigo-600">{event.title}</span>.</p>
           <button onClick={() => { onClose(); navigate('/my-tickets'); }} className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95"><Ticket className="w-4 h-4" /> View My Pass</button>
        </div>
      </div>
    );
  }

  // INCOMPLETE PROFILE UI
  if (!isProfileComplete) {
    return (
      <>
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] p-8 text-center border dark:border-zinc-800">
             <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600"><ShieldCheck className="w-8 h-8" /></div>
             <h2 className="text-2xl font-black dark:text-white uppercase italic mb-2">Profile Incomplete</h2>
             <p className="text-zinc-500 text-sm mb-6">Complete your profile to register.</p>
             <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-4 mb-8 text-left text-xs font-bold text-zinc-500 space-y-1">
                <p className="uppercase tracking-widest mb-2 border-b pb-2">Missing Info:</p>
                {!profile?.rollNo && <p className="text-red-500 flex gap-2"><AlertTriangle className="w-3 h-3"/> Roll Number</p>}
                {!(profile?.phoneNumber || profile?.phone) && <p className="text-red-500 flex gap-2"><AlertTriangle className="w-3 h-3"/> Phone Number</p>}
                {!profile?.branch && <p className="text-red-500 flex gap-2"><AlertTriangle className="w-3 h-3"/> Branch</p>}
                {!profile?.group && <p className="text-red-500 flex gap-2"><AlertTriangle className="w-3 h-3"/> Group / Semester</p>}
                {!profile?.residency && <p className="text-red-500 flex gap-2"><AlertTriangle className="w-3 h-3"/> Residency</p>}
             </div>
             <button onClick={() => setShowProfileModal(true)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Complete Profile</button>
             <button onClick={onClose} className="mt-4 text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-600">Cancel</button>
          </div>
        </div>
        <UserProfile isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] shadow-2xl border dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b dark:border-zinc-900 flex justify-between bg-white dark:bg-black/40">
          <div><h2 className="text-xl font-black dark:text-white uppercase italic">Entry Portal</h2><p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{event.title}</p></div>
          <button onClick={onClose}><X className="h-5 w-5 text-zinc-500" /></button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar">
          {step === 'choice' ? (
             <div className="space-y-4">
               <button onClick={() => { setMode('solo'); setStep('form'); }} className="w-full p-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[1.5rem] flex items-center gap-4 hover:border-indigo-500 shadow-sm transition-all">
                 <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><User className="h-6 w-6" /></div>
                 <div className="flex-1 text-left"><h3 className="font-black text-sm uppercase dark:text-white">Individual</h3></div>
                 <ArrowRight className="h-4 w-4 text-zinc-300" />
               </button>
             </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl space-y-3 shadow-sm">
                 <div className="flex items-center gap-2 border-b border-indigo-200 dark:border-indigo-800 pb-2 mb-2 text-indigo-600">
                    <ShieldCheck className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Verified Identity</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4 text-xs">
                    <div><p className="text-zinc-400 uppercase">Roll No</p><p className="font-bold dark:text-white">{profile.rollNo}</p></div>
                    <div><p className="text-zinc-400 uppercase">Group</p><p className="font-bold dark:text-white">{profile.group}</p></div>
                    <div><p className="text-zinc-400 uppercase">Branch</p><p className="font-bold dark:text-white">{profile.branch}</p></div>
                    <div><p className="text-zinc-400 uppercase">Residency</p><p className="font-bold dark:text-white">{profile.residency}</p></div>
                 </div>
              </div>
              {event.customQuestions && event.customQuestions.map(q => (
                  <div key={q.id} className="space-y-1">
                      <label className="text-xs font-bold dark:text-zinc-300">{q.label} {q.required && '*'}</label>
                      <input type={q.type === 'number' ? 'number' : 'text'} required={q.required} onChange={e => handleCustomAnswerChange(q.id, e.target.value)} className="w-full p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl outline-none font-bold text-sm dark:text-white" />
                  </div>
              ))}
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
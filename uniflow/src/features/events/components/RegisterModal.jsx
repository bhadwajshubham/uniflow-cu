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

  // ==========================================
  // 🔍 1. MISSING FIELDS LOGIC (Improved)
  // ==========================================
  const getMissingFields = () => {
    if (!profile) return ["Loading Profile..."];
    
    const missing = [];
    
    // Check fields strictly
    if (!profile.rollNo || String(profile.rollNo).trim() === '') missing.push("Roll Number");
    if (!profile.branch || String(profile.branch).trim() === '') missing.push("Branch");
    if (!profile.group || String(profile.group).trim() === '') missing.push("Group / Semester");
    if (!profile.residency || String(profile.residency).trim() === '') missing.push("Residency");
    
    // Check phone (handle variations)
    const phone = profile.phoneNumber || profile.phone;
    if (!phone || String(phone).trim() === '') missing.push("Phone Number");

    return missing;
  };

  const missingFields = getMissingFields();
  const isProfileComplete = missingFields.length === 0;

  // 2. CHECK REGISTRATION STATUS
  useEffect(() => {
    const checkRegistration = async () => {
      if (user && event && isOpen) {
        try {
          const regRef = doc(db, 'tickets', `${event.id}_${user.uid}`);
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

  // Reset Logic
  useEffect(() => {
    if (isOpen) {
        if (isTeamEvent) { setStep('choice'); setMode(null); } 
        else { setStep('form'); setMode('solo'); }
    }
  }, [isTeamEvent, isOpen]); 

  if (!isOpen || !event) return null;

  // Handle Custom Questions
  const handleCustomAnswerChange = (qId, value) => {
    setCustomAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Fallback for Name (To fix Image 5 issue)
    const finalName = profile.userName || profile.name || user.displayName || 'Student';

    const finalData = {
        ...profile,
        userName: finalName, // Ensure name is sent
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

  // ------------------------------------------
  // STATE 1: SUCCESS / ALREADY REGISTERED
  // ------------------------------------------
  if (isAlreadyRegistered || isSuccess) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-center p-8 relative">
           
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
             Your pass for <span className="font-bold text-indigo-600">{event.title}</span> is ready.
           </p>
           
           <div className="space-y-3">
             <button onClick={() => { onClose(); navigate('/my-tickets'); }} className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
               <Ticket className="w-4 h-4" /> View My Pass
             </button>
             <button onClick={onClose} className="text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-600">Close</button>
           </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // STATE 2: PROFILE INCOMPLETE (BLOCKING UI)
  // ------------------------------------------
  if (!isProfileComplete) {
    return (
      <>
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-center p-8">
             <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
               <ShieldCheck className="w-8 h-8" />
             </div>
             <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter mb-2">Profile Incomplete</h2>
             <p className="text-zinc-500 font-medium text-sm mb-6 px-4">
               Complete your profile to register.
             </p>

             {/* ✅ FIX: Dynamic List of Missing Fields */}
             <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-4 mb-8 text-left text-xs font-bold text-zinc-500 space-y-2">
                <p className="uppercase tracking-widest mb-2 border-b border-zinc-300 dark:border-zinc-700 pb-2 text-zinc-400">Missing Info:</p>
                {missingFields.map((field, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-red-500 animate-pulse">
                        <AlertTriangle className="w-3 h-3"/> {field}
                    </div>
                ))}
             </div>

             <button onClick={() => setShowProfileModal(true)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all">
               Complete Profile
             </button>
             <button onClick={onClose} className="mt-4 text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-600">Cancel</button>
          </div>
        </div>
        {/* Open UserProfile Modal to fix data */}
        <UserProfile isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      </>
    );
  }

  // ------------------------------------------
  // STATE 3: READY TO REGISTER (VERIFIED IDENTITY)
  // ------------------------------------------
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-black/40 text-center relative">
          <div className="w-full">
            <h2 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic">Entry Portal</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{event.title}</p>
          </div>
          <button onClick={onClose} className="absolute right-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"><X className="h-5 w-5 text-zinc-500" /></button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {step === 'choice' ? (
             <div className="space-y-4">
               {/* MODE SELECTION (Solo/Team) */}
               <button onClick={() => { setMode('solo'); setStep('form'); }} className="w-full p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] hover:border-indigo-500 transition-all group flex items-center gap-4 text-left shadow-sm">
                 <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center"><User className="h-6 w-6" /></div>
                 <div className="flex-1"><h3 className="font-black text-sm uppercase dark:text-white">Individual</h3><p className="text-[10px] text-zinc-500">Book for yourself</p></div>
                 <ArrowRight className="h-4 w-4 text-zinc-300" />
               </button>
               {/* Team Logic will go here */}
             </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              
              {/* ✅ IDENTITY CARD (With Name Fix) */}
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl space-y-3 shadow-sm">
                 <div className="flex items-center gap-2 border-b border-indigo-200 dark:border-indigo-800 pb-2 mb-2 text-indigo-600">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">Verified Identity</span>
                 </div>
                 <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                    {/* Name Fix: Check multiple fields */}
                    <div>
                        <p className="text-[9px] text-indigo-400 uppercase font-bold">Name</p>
                        <p className="font-black dark:text-white truncate">
                            {profile.userName || profile.name || user.displayName || 'Student'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[9px] text-indigo-400 uppercase font-bold">Roll No</p>
                        <p className="font-black dark:text-white">{profile.rollNo}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-indigo-400 uppercase font-bold">Group</p>
                        <p className="font-black dark:text-white">{profile.group}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-indigo-400 uppercase font-bold">Residency</p>
                        <p className="font-black dark:text-white">{profile.residency}</p>
                    </div>
                 </div>
              </div>

              {/* ❓ CUSTOM QUESTIONS */}
              {event.customQuestions && event.customQuestions.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Additional Details</p>
                    {event.customQuestions.map((q) => (
                        <div key={q.id} className="space-y-1">
                            <label className="text-xs font-bold dark:text-zinc-300">
                                {q.label} {q.required && <span className="text-red-500">*</span>}
                            </label>
                            
                            {q.type === 'select' ? (
                                <div className="relative">
                                    <select 
                                        required={q.required}
                                        onChange={(e) => handleCustomAnswerChange(q.id, e.target.value)}
                                        className="w-full p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl appearance-none outline-none font-bold text-sm dark:text-white"
                                    >
                                        <option value="">Select an option</option>
                                        {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            ) : q.type === 'number' ? (
                                <input 
                                    type="number" 
                                    required={q.required}
                                    placeholder="Enter value"
                                    onChange={(e) => handleCustomAnswerChange(q.id, e.target.value)}
                                    className="w-full p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl outline-none font-bold text-sm dark:text-white"
                                />
                            ) : (
                                <input 
                                    type="text" 
                                    required={q.required}
                                    placeholder="Your answer"
                                    onChange={(e) => handleCustomAnswerChange(q.id, e.target.value)}
                                    className="w-full p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl outline-none font-bold text-sm dark:text-white"
                                />
                            )}
                        </div>
                    ))}
                </div>
              )}

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
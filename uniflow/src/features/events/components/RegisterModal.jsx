import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, User, Loader2, ArrowRight, ShieldCheck, 
  Ticket, CheckCircle, AlertTriangle, Save
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { registerForEvent, registerTeam, joinTeam } from '../services/registrationService';

const RegisterModal = ({ event, onClose, isOpen }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // UX Fix: Force UI to update immediately after quick save
  const [forceProfileComplete, setForceProfileComplete] = useState(false);

  const [step, setStep] = useState('form'); 
  const [mode, setMode] = useState('solo');
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [customAnswers, setCustomAnswers] = useState({});

  // 🔥 UPDATE STATE
  const [updateData, setUpdateData] = useState({
    name: '', rollNo: '', phone: '', 
    gender: '', branch: '', semester: '', 
    group: '', residency: ''
  });

  const [showOtherBranch, setShowOtherBranch] = useState(false); 
  const [customBranch, setCustomBranch] = useState('');

  // ✅ SIMPLIFIED OPTIONS
  const BRANCH_OPTIONS = ["CSE", "CSE (AI)", "Others"];
  const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

  const isTeamEvent = event?.type === 'team' || event?.teamSize > 1;

  // 1. MISSING FIELDS CHECK
  const getMissingFields = () => {
    if (forceProfileComplete) return []; // UX Fix: If just saved, assume complete
    if (!profile) return [];
    
    const missing = [];
    if (!profile.rollNo?.trim()) missing.push("Roll Number");
    if (!profile.phone?.trim() && !profile.phoneNumber?.trim()) missing.push("Phone Number");
    if (!profile.branch?.trim()) missing.push("Branch");
    if (!profile.semester) missing.push("Semester"); // Added Semester
    if (!profile.group?.trim()) missing.push("Group"); 
    if (!profile.residency?.trim()) missing.push("Residency");
    return missing;
  };

  const missingFields = getMissingFields();
  const isProfileComplete = missingFields.length === 0;

  // 2. CHECK REGISTRATION
  useEffect(() => {
    const checkRegistration = async () => {
      if (user && event && isOpen) {
        try {
          const regRef = doc(db, 'tickets', `${event.id}_${user.uid}`);
          const regSnap = await getDoc(regRef);
          if (regSnap.exists()) setIsAlreadyRegistered(true);
        } catch (err) { console.error(err); }
      }
    };
    checkRegistration();
  }, [user, event, isOpen]);

  // 🔥 INIT DATA
  useEffect(() => {
    if (profile) {
        const currentBranch = profile.branch || '';
        const isStandard = BRANCH_OPTIONS.includes(currentBranch) && currentBranch !== 'Others';
        
        setUpdateData({
            name: profile.name || profile.userName || user.displayName || '',
            rollNo: profile.rollNo || '',
            phone: profile.phoneNumber || profile.phone || '',
            gender: profile.gender || '',
            branch: isStandard ? currentBranch : (currentBranch ? 'Others' : ''),
            semester: profile.semester || '',
            group: profile.group || '',
            residency: profile.residency || ''
        });

        if (currentBranch && !isStandard) {
            setShowOtherBranch(true);
            setCustomBranch(currentBranch);
        }
    }
  }, [profile, user]);

  if (!isOpen || !event) return null;

  // 3. ACTIONS
  const handleCustomAnswerChange = (qId, value) => {
    setCustomAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleBranchChange = (e) => {
      const val = e.target.value;
      if (val === 'Others') {
          setShowOtherBranch(true);
          setUpdateData({ ...updateData, branch: 'Others' });
      } else {
          setShowOtherBranch(false);
          setUpdateData({ ...updateData, branch: val });
      }
  };

  // ✅ AUTO-FLOW LOGIC (Saves & Continues without Reload)
  const handleQuickUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    let finalBranch = updateData.branch;
    if (showOtherBranch) {
        finalBranch = customBranch.toUpperCase();
    }

    try {
        const userRef = doc(db, 'users', user.uid);
        const newData = {
            name: updateData.name,
            rollNo: updateData.rollNo.toUpperCase(),
            phoneNumber: updateData.phone,
            phone: updateData.phone,
            gender: updateData.gender,
            branch: finalBranch,
            semester: updateData.semester,
            group: updateData.group.toUpperCase(),
            residency: updateData.residency
        };

        await updateDoc(userRef, newData);
        
        // 🚀 UX FIX: Reload karne ki zarurat nahi. 
        // Hum system ko bolenge "Profile Complete ho gayi, aage badho"
        setForceProfileComplete(true);
        setIsEditing(false); // Close edit mode
        
        // Update local state so the Booking Form sees new data immediately
        setUpdateData(prev => ({...prev, ...newData}));

    } catch (error) {
        alert("Update failed: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Merge latest updateData in case user just edited it
    const finalData = { ...profile, ...updateData, customAnswers };
    
    try {
      if (mode === 'solo') await registerForEvent(event.id, user, finalData);
      else if (mode === 'create_team') await registerTeam(event.id, user, teamName, finalData);
      else if (mode === 'join_team') await joinTeam(event.id, user, teamCode, finalData);
      
      setIsSuccess(true);
      setIsAlreadyRegistered(true);
    } catch (error) {
      alert("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- UI: SUCCESS ---
  if (isAlreadyRegistered || isSuccess) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] p-8 text-center border dark:border-zinc-800">
           <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600"><CheckCircle className="w-10 h-10" /></div>
           <h2 className="text-2xl font-black dark:text-white uppercase italic mb-2">Confirmed!</h2>
           <p className="text-zinc-500 text-sm mb-8">Ticket sent to email.</p>
           <button onClick={() => { onClose(); navigate('/my-tickets'); }} className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"><Ticket className="w-4 h-4" /> View Ticket</button>
        </div>
      </div>
    );
  }

  // --- UI: PROFILE INCOMPLETE (QUICK EDIT) ---
  // Agar profile complete nahi hai AND humne abhi-abhi force complete nahi kiya
  if (!isProfileComplete) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
        <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] shadow-2xl border dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
             
             <div className="p-6 text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600"><ShieldCheck className="w-8 h-8" /></div>
                <h2 className="text-2xl font-black dark:text-white uppercase italic">Complete Profile</h2>
                <p className="text-zinc-500 text-xs mt-1">Required for booking.</p>
             </div>

             <div className="p-8 pt-0 overflow-y-auto custom-scrollbar">
                {isEditing ? (
                    <form onSubmit={handleQuickUpdate} className="space-y-4">
                        {/* Name & Roll */}
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Full Name" required value={updateData.name} onChange={e=>setUpdateData({...updateData, name: e.target.value})} className="w-full p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-bold text-xs outline-none dark:text-white" />
                            <input placeholder="Roll No" required value={updateData.rollNo} onChange={e=>setUpdateData({...updateData, rollNo: e.target.value.toUpperCase()})} className="w-full p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-bold text-xs outline-none dark:text-white uppercase" />
                        </div>

                        {/* Phone & Gender */}
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Phone" type="tel" required value={updateData.phone} onChange={e=>setUpdateData({...updateData, phone: e.target.value})} className="w-full p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-bold text-xs outline-none dark:text-white" />
                            <select required value={updateData.gender} onChange={e=>setUpdateData({...updateData, gender: e.target.value})} className="w-full p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-bold text-xs outline-none dark:text-white">
                                <option value="">Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>

                        {/* Branch & Semester (UPDATED) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <select required value={updateData.branch} onChange={handleBranchChange} className="w-full p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-bold text-xs outline-none dark:text-white">
                                    <option value="">Branch</option>
                                    {BRANCH_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            
                            <select required value={updateData.semester} onChange={e=>setUpdateData({...updateData, semester: e.target.value})} className="w-full p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-bold text-xs outline-none dark:text-white">
                                <option value="">Sem</option>
                                {SEMESTER_OPTIONS.map(sem => <option key={sem} value={sem}>{sem}th</option>)}
                            </select>
                        </div>
                        
                        {/* Custom Branch Input */}
                        {showOtherBranch && (
                            <input 
                                placeholder="TYPE BRANCH (e.g. BBA)" 
                                required 
                                value={customBranch} 
                                onChange={e=>setCustomBranch(e.target.value.toUpperCase())} 
                                className="w-full p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-bold text-xs outline-none dark:text-white border border-indigo-500 uppercase" 
                            />
                        )}

                        {/* Group & Residency */}
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Group (e.g. G12)" required value={updateData.group} onChange={e=>setUpdateData({...updateData, group: e.target.value.toUpperCase()})} className="w-full p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-bold text-xs outline-none dark:text-white uppercase" />
                            <select required value={updateData.residency} onChange={e=>setUpdateData({...updateData, residency: e.target.value})} className="w-full p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl font-bold text-xs outline-none dark:text-white">
                                <option value="">Residency</option>
                                <option value="Day Scholar">Day Scholar</option>
                                <option value="Hosteller">Hosteller</option>
                            </select>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest mt-2 flex justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <><Save className="w-4 h-4"/> Save & Continue</>}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-4 text-left text-xs font-bold text-zinc-500 space-y-2">
                            <p className="uppercase tracking-widest mb-2 border-b pb-2">Missing Fields:</p>
                            {missingFields.map((field, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-red-500 animate-pulse"><AlertTriangle className="w-3 h-3"/> {field}</div>
                            ))}
                        </div>
                        <button onClick={() => setIsEditing(true)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all">
                           Update Now
                        </button>
                        <button onClick={onClose} className="w-full text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-600">Cancel</button>
                    </div>
                )}
             </div>
        </div>
      </div>
    );
  }

  // --- UI: REGISTER ---
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] shadow-2xl border dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b dark:border-zinc-900 flex justify-between items-center relative">
          <div><h2 className="text-xl font-black dark:text-white uppercase italic">Entry Portal</h2><p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{event.title}</p></div>
          <button onClick={onClose} className="absolute right-4 p-2 text-zinc-400"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {step === 'choice' ? (
             <div className="space-y-4">
               <button onClick={() => { setMode('solo'); setStep('form'); }} className="w-full p-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[1.5rem] flex items-center gap-4 hover:border-indigo-500 shadow-sm">
                 <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><User className="h-6 w-6" /></div>
                 <div className="flex-1 text-left"><h3 className="font-black text-sm uppercase dark:text-white">Individual</h3></div>
                 <ArrowRight className="h-4 w-4 text-zinc-300" />
               </button>
             </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl space-y-3 shadow-sm">
                 <div className="flex items-center gap-2 border-b dark:border-indigo-800 pb-2 mb-2 text-indigo-600">
                    <ShieldCheck className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Verified Identity</span>
                 </div>
                 <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                    <div><p className="text-[9px] text-indigo-400 uppercase font-bold">Name</p><p className="font-black dark:text-white truncate">{updateData.name || user.displayName}</p></div>
                    <div><p className="text-[9px] text-indigo-400 uppercase font-bold">Roll No</p><p className="font-black dark:text-white">{updateData.rollNo}</p></div>
                    <div><p className="text-[9px] text-indigo-400 uppercase font-bold">Branch</p><p className="font-black dark:text-white">{updateData.branch}</p></div>
                    <div><p className="text-[9px] text-indigo-400 uppercase font-bold">Semester</p><p className="font-black dark:text-white">{updateData.semester ? updateData.semester + 'th' : 'N/A'}</p></div>
                 </div>
              </div>
              
              {event.customQuestions && event.customQuestions.map(q => (
                  <div key={q.id} className="space-y-1">
                      <label className="text-xs font-bold dark:text-zinc-300">{q.label} {q.required && '*'}</label>
                      <input type={q.type === 'number' ? 'number' : 'text'} required={q.required} onChange={e => handleCustomAnswerChange(q.id, e.target.value)} className="w-full p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl outline-none font-bold text-sm dark:text-white" />
                  </div>
              ))}

              <button type="submit" disabled={loading} className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto h-4 w-4" /> : 'Confirm Booking'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
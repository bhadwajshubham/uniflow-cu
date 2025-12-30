import { useState, useEffect } from 'react';
import { 
  X, User, Loader2, ArrowRight, ShieldCheck, 
  Hash, Smartphone, GraduationCap 
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { registerForEvent, registerTeam, joinTeam } from '../services/registrationService';
import UserProfile from '../../auth/components/UserProfile';

const RegisterModal = ({ event, onClose, isOpen }) => {
  const { user, profile } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');

  const isTeamEvent = event?.type === 'team' || event?.participationType === 'team';

  const [step, setStep] = useState('form'); 
  const [mode, setMode] = useState('solo');

  // 1. 🛡️ AUTO-FILL from Profile (Including Residency now)
  const [studentData, setStudentData] = useState({
    rollNo: '', phone: '', residency: '', group: '', branch: '', showPublicly: true
  });

  useEffect(() => {
    if (isTeamEvent) {
       setStep('choice');
       setMode(null);
    } else {
       setStep('form');
       setMode('solo');
    }
  }, [isTeamEvent, isOpen]); 

  useEffect(() => {
    if (profile) {
      setStudentData(prev => ({
        ...prev,
        rollNo: profile.rollNo || '',
        phone: profile.phone || '',
        branch: profile.branch || '',
        group: profile.group || '',
        residency: profile.residency || '' // 🆕 Auto-fill Residency
      }));
    }
  }, [profile]);

  if (!isOpen || !event) return null;

  // 2. 🛡️ CHECK PROFILE COMPLETENESS (Including Residency)
  const isProfileComplete = profile?.rollNo && profile?.phone && profile?.branch && profile?.residency;

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setStep('form');
  };

  const isStudentInfoComplete = 
    /^\d{10}$/.test(studentData.rollNo.trim()) && 
    /^\d{10}$/.test(studentData.phone.trim()) && 
    studentData.branch &&
    studentData.residency && 
    studentData.group.trim();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'solo') await registerForEvent(event.id, user, studentData);
      else if (mode === 'create_team') await registerTeam(event.id, user, teamName, studentData);
      else if (mode === 'join_team') await joinTeam(event.id, user, teamCode, studentData);
      
      onClose();
      window.location.reload(); 
    } catch (error) {
      alert("❌ " + (error.message || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  // 3. 🛡️ BLOCKING UI (If Profile Missing)
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
               Please update your Residency Status (Hosteller/Day Scholar) in your profile to proceed.
             </p>
             <button 
               onClick={() => setShowProfileModal(true)}
               className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all"
             >
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

  // 4. NORMAL FORM
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-black/40 text-center relative">
          <div className="w-full">
            <h2 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic">Entry Portal</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{event.title}</p>
          </div>
          <button onClick={onClose} className="absolute right-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {step === 'choice' ? (
            <div className="space-y-4">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2">Select Participation</p>
              
              <button onClick={() => handleModeSelect('solo')} className="w-full p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] hover:border-indigo-500 transition-all group flex items-center gap-4 text-left shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-zinc-900 dark:text-white text-sm uppercase">Individual</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Solo Entry</p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-300" />
              </button>

              <button onClick={() => handleModeSelect('create_team')} className="w-full p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] hover:border-purple-500 transition-all group flex items-center gap-4 text-left shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-zinc-900 dark:text-white text-sm uppercase">Team Leader</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Create & Invite</p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-300" />
              </button>

              <button onClick={() => handleModeSelect('join_team')} className="w-full p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] hover:border-zinc-400 transition-all group flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                  <Hash className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-zinc-400 dark:text-zinc-500 text-sm uppercase">Join Squad</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Enter Code</p>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex gap-3 shadow-sm">
                 <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                 <p className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase leading-tight">
                    IDENTITY VERIFIED: {studentData.rollNo}
                 </p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Additional Details</p>
                {isTeamEvent && (
                  <button type="button" onClick={() => setStep('choice')} className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 dark:hover:text-white uppercase transition-colors">← Change Mode</button>
                )}
              </div>

              {/* READ ONLY FIELDS (Auto-filled from Profile) */}
              <div className="grid grid-cols-2 gap-4 opacity-70 pointer-events-none">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400">Roll No</label>
                    <input readOnly value={studentData.rollNo} className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-xs dark:text-white" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400">Residency</label>
                    {/* 🆕 Residency is now read-only here */}
                    <input readOnly value={studentData.residency} className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-xs dark:text-white" />
                 </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input required type="tel" pattern="\d{10}" title="Exactly 10 digit Mobile Number" placeholder="Mobile" className="w-full pl-10 pr-4 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold dark:text-white outline-none"
                      value={studentData.phone} onChange={e => setStudentData({...studentData, phone: e.target.value})} />
                  </div>
                  <input required type="text" placeholder="Group (e.g. G1)" className="w-full px-4 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold dark:text-white outline-none"
                    value={studentData.group} onChange={e => setStudentData({...studentData, group: e.target.value})} />
                </div>
              </div>

              {mode === 'create_team' && (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-bottom-2 duration-300">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase mb-2 ml-1 tracking-widest">Set Team Identity</label>
                  <input required type="text" placeholder="e.g. Pixel Pioneers" className="w-full px-5 py-4 bg-indigo-50 dark:bg-indigo-900/10 border-none rounded-2xl text-sm font-bold dark:text-white outline-none"
                    value={teamName} onChange={e => setTeamName(e.target.value)} />
                </div>
              )}

              {mode === 'join_team' && (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-bottom-2 duration-300">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase mb-2 ml-1 tracking-widest">Secret Entry Code</label>
                  <input required type="text" placeholder="X7Y9Z" maxLength={6} className="w-full px-4 py-4 bg-purple-50 dark:bg-purple-900/10 border-none rounded-2xl text-lg font-black outline-none tracking-[0.5em] text-center dark:text-white"
                    value={teamCode} onChange={e => setTeamCode(e.target.value.toUpperCase())} />
                </div>
              )}

              <button type="submit" disabled={loading || !isStudentInfoComplete}
                className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl shadow-indigo-500/10 disabled:opacity-20 active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto h-4 w-4 text-indigo-600" /> : 'Confirm Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
import { useState } from 'react';
import { 
  X, User, Users, Loader2, ArrowRight, ShieldCheck, 
  Hash, AlertTriangle, Smartphone, BookOpen, GraduationCap 
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { registerForEvent, registerTeam, joinTeam } from '../services/registrationService';

const RegisterModal = ({ event, onClose, isOpen }) => {
  const { user } = useAuth();
  
  if (!isOpen || !event) return null;

  const isTeamEvent = (event.type === 'team' || event.participationType === 'team');
  const hasEligibility = event.eligibility && event.eligibility.length > 0;

  const [step, setStep] = useState(isTeamEvent ? 'choice' : 'form'); 
  const [mode, setMode] = useState(isTeamEvent ? null : 'solo');
  const [loading, setLoading] = useState(false);
  const [confirmedEligibility, setConfirmedEligibility] = useState(false);
  
  const [studentData, setStudentData] = useState({
    rollNo: '',
    phone: '',
    residency: '', 
    group: '',
    branch: '',
    showPublicly: true
  });

  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setStep('form');
  };

  const isStudentInfoComplete = 
    studentData.rollNo.trim().length > 5 && 
    studentData.phone.trim().length >= 10 && 
    studentData.branch !== '' &&
    studentData.residency !== '' && 
    studentData.group.trim() !== '';

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (hasEligibility && !confirmedEligibility) {
        alert("Please confirm your eligibility checkmark.");
        return;
    }

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

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#FDFBF7] dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
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
              
              {/* ⚠️ ELIGIBILITY WARNING ALERT */}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex gap-3 shadow-sm">
                 <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                 <p className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase leading-tight">
                    ELIGIBILITY: STRICTLY FOR <span className="underline italic">C.S.E. & C.S.E. (AI)</span> STUDENTS FROM CHITKARA ONLY. @chitkara ID MANDATORY.
                 </p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Verify Information</p>
                {isTeamEvent && (
                  <button type="button" onClick={() => setStep('choice')} className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 dark:hover:text-white uppercase transition-colors">← Change Participation</button>
                )}
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input required type="text" placeholder="Roll Number (e.g. 231099xxxx)" className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={studentData.rollNo} onChange={e => setStudentData({...studentData, rollNo: e.target.value})} />
                </div>
                
                <div className="relative group">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                  <select required className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold dark:text-white appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={studentData.branch} onChange={e => setStudentData({...studentData, branch: e.target.value})}>
                    <option value="">Choose Branch...</option>
                    <option value="B.E. (C.S.E.)">B.E. (C.S.E.)</option>
                    <option value="B.E. (C.S.E. AI)">B.E. (C.S.E. AI)</option>
                    <option value="Other">Other Branch</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input required type="tel" placeholder="Mobile" className="w-full pl-10 pr-4 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold dark:text-white outline-none"
                      value={studentData.phone} onChange={e => setStudentData({...studentData, phone: e.target.value})} />
                  </div>
                  <input required type="text" placeholder="Group (e.g. G1)" className="w-full px-4 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold dark:text-white outline-none"
                    value={studentData.group} onChange={e => setStudentData({...studentData, group: e.target.value})} />
                </div>

                <select required className="w-full px-4 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold dark:text-white appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={studentData.residency} onChange={e => setStudentData({...studentData, residency: e.target.value})}>
                  <option value="">Residency Type...</option>
                  <option value="Hosteller">Hosteller</option>
                  <option value="Day Scholar">Day Scholar</option>
                </select>
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

              <div className="space-y-3">
                {hasEligibility && (
                  <label className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 cursor-pointer hover:bg-amber-100 transition-colors">
                    <input type="checkbox" required checked={confirmedEligibility} onChange={e => setConfirmedEligibility(e.target.checked)} className="w-5 h-5 accent-amber-600 rounded" />
                    <span className="text-[10px] font-black text-amber-800 dark:text-amber-500 uppercase leading-tight">Eligibility: {event.eligibility}</span>
                  </label>
                )}

                <label className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl cursor-pointer shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-xs font-black dark:text-white uppercase tracking-tight">Social Presence</span>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Show in Attendee List</span>
                  </div>
                  <input type="checkbox" checked={studentData.showPublicly} onChange={e => setStudentData({...studentData, showPublicly: e.target.checked})} className="w-6 h-6 accent-indigo-600 rounded-full" />
                </label>
              </div>

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
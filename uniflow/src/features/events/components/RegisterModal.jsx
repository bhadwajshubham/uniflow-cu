import { useState } from 'react';
import { X, User, Users, Loader2, ArrowRight, ShieldCheck, Hash, AlertTriangle, Smartphone, Home } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { registerForEvent, registerTeam, joinTeam } from '../services/registrationService';

const RegisterModal = ({ event, onClose, isOpen }) => {
  const { user } = useAuth();
  
  if (!isOpen || !event) return null;

  const isTeamEvent = (event.type === 'team' || event.participationType === 'team');
  const hasEligibility = event.eligibility && event.eligibility.length > 0;

  const initialStep = isTeamEvent ? 'choice' : 'form';
  const initialMode = isTeamEvent ? null : 'solo';

  const [step, setStep] = useState(initialStep); 
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [confirmedEligibility, setConfirmedEligibility] = useState(false);
  
  // 📋 MANDATORY STUDENT DATA
  const [studentData, setStudentData] = useState({
    rollNo: '',
    phone: '',
    residency: '', // 'Hosteller' or 'Day Scholar'
    group: '',
    showPublicly: true
  });

  // Inputs for Team
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setStep('form');
  };

  // 🛡️ VALIDATION: Check if all mandatory student fields are filled
  const isStudentInfoComplete = 
    studentData.rollNo.trim().length > 2 && 
    studentData.phone.trim().length >= 10 && 
    studentData.residency !== '' && 
    studentData.group.trim() !== '';

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (hasEligibility && !confirmedEligibility) {
        alert("Please confirm your eligibility.");
        return;
    }

    if (!isStudentInfoComplete) {
        alert("Please fill in all mandatory student details.");
        return;
    }

    setLoading(true);

    try {
      if (mode === 'solo') {
        await registerForEvent(event.id, user, studentData);
        alert("✅ Registration Successful!");
      } 
      else if (mode === 'create_team') {
        const res = await registerTeam(event.id, user, teamName, studentData);
        alert(`✅ Team Created! Your Code: ${res.teamCode}`);
      } 
      else if (mode === 'join_team') {
        await joinTeam(event.id, user, teamCode, studentData);
        alert("✅ Joined Team Successfully!");
      }
      onClose();
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert("❌ " + (error.message || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-[#FDFBF7] dark:bg-zinc-900 w-full max-w-md rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-black/20">
          <div>
            <h2 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">Secure Entry</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{event.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {step === 'choice' ? (
            <div className="space-y-4">
              <p className="text-sm font-black text-zinc-400 uppercase tracking-wider mb-2">Select Participation</p>
              
              {!isTeamEvent && (
                <button onClick={() => handleModeSelect('solo')} className="w-full p-5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl hover:border-indigo-500 transition-all group flex items-center gap-4 text-left shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-zinc-900 dark:text-white text-lg leading-tight uppercase tracking-tighter">Individual</h3>
                    <p className="text-xs text-zinc-500 font-bold">Standard Single Entry</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-zinc-300" />
                </button>
              )}

              {isTeamEvent && (
                <>
                  <button onClick={() => handleModeSelect('create_team')} className="w-full p-5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl hover:border-purple-500 transition-all group flex items-center gap-4 text-left shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-zinc-900 dark:text-white text-lg leading-tight uppercase tracking-tighter">Lead a Team</h3>
                      <p className="text-xs text-zinc-500 font-bold">Create new team & invite friends</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-zinc-300" />
                  </button>

                  <button onClick={() => handleModeSelect('join_team')} className="w-full p-5 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl hover:border-zinc-400 transition-all group flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white">
                      <Hash className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-zinc-400 dark:text-zinc-500 text-lg leading-tight uppercase tracking-tighter">Join Squad</h3>
                      <p className="text-xs text-zinc-500 font-bold">Enter existing team code</p>
                    </div>
                  </button>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Provide Details</p>
                {isTeamEvent && (
                  <button type="button" onClick={() => setStep('choice')} className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 uppercase">← Change Mode</button>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input required type="text" placeholder="Roll Number" className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600/20 dark:text-white"
                      value={studentData.rollNo} onChange={e => setStudentData({...studentData, rollNo: e.target.value})} />
                  </div>
                  
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input required type="tel" placeholder="Phone Number" className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600/20 dark:text-white"
                      value={studentData.phone} onChange={e => setStudentData({...studentData, phone: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select required className="w-full px-4 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600/20 dark:text-white appearance-none"
                    value={studentData.residency} onChange={e => setStudentData({...studentData, residency: e.target.value})}>
                    <option value="">Residency...</option>
                    <option value="Hosteller">Hosteller</option>
                    <option value="Day Scholar">Day Scholar</option>
                  </select>

                  <input required type="text" placeholder="Group (e.g. G1)" className="w-full px-4 py-4 bg-zinc-100 dark:bg-black border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600/20 dark:text-white"
                    value={studentData.group} onChange={e => setStudentData({...studentData, group: e.target.value})} />
                </div>
              </div>

              {mode === 'create_team' && (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase mb-2">Team Name</label>
                  <input required type="text" placeholder="The Code Warriors" className="w-full px-4 py-4 bg-indigo-50 dark:bg-indigo-900/10 border-none rounded-2xl text-sm font-bold outline-none dark:text-white"
                    value={teamName} onChange={e => setTeamName(e.target.value)} />
                </div>
              )}

              {mode === 'join_team' && (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase mb-2">Access Code</label>
                  <input required type="text" placeholder="X7Y9Z" maxLength={6} className="w-full px-4 py-4 bg-purple-50 dark:bg-purple-900/10 border-none rounded-2xl text-lg font-black outline-none tracking-[0.5em] text-center dark:text-white"
                    value={teamCode} onChange={e => setTeamCode(e.target.value.toUpperCase())} />
                </div>
              )}

              <div className="space-y-3">
                {hasEligibility && (
                  <label className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 cursor-pointer">
                    <input type="checkbox" required checked={confirmedEligibility} onChange={e => setConfirmedEligibility(e.target.checked)} className="w-5 h-5 accent-amber-600 rounded" />
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-500 uppercase leading-tight">Eligibility: {event.eligibility}</span>
                  </label>
                )}

                <label className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-xs font-black dark:text-white">Social Mode</span>
                    <span className="text-[10px] text-zinc-400 font-bold">Show in "Who's Going"</span>
                  </div>
                  <input type="checkbox" checked={studentData.showPublicly} onChange={e => setStudentData({...studentData, showPublicly: e.target.checked})} className="w-6 h-6 accent-indigo-600 rounded-full" />
                </label>
              </div>

              <button type="submit" disabled={loading || (hasEligibility && !confirmedEligibility) || !isStudentInfoComplete}
                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
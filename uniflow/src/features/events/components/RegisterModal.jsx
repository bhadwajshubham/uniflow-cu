import { useState } from 'react';
import { X, User, Users, Loader2, ArrowRight, ShieldCheck, Hash, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { registerForEvent, registerTeam, joinTeam } from '../services/registrationService';

const RegisterModal = ({ event, onClose, isOpen }) => {
  // 🔥 FIX 1: Use 'user' from our current AuthContext
  const { user } = useAuth();
  
  if (!isOpen || !event) return null;

  // 🔥 FIX 2: Handle both old 'participationType' and new 'type' naming conventions
  // If event.type is 'team', or participationType is 'team' -> It is a team event.
  const isTeamEvent = (event.type === 'team' || event.participationType === 'team');
  const hasEligibility = event.eligibility && event.eligibility.length > 0;

  const initialStep = isTeamEvent ? 'choice' : 'form';
  const initialMode = isTeamEvent ? null : 'solo';

  const [step, setStep] = useState(initialStep); 
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [confirmedEligibility, setConfirmedEligibility] = useState(false);
  
  // Inputs
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setStep('form');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Eligibility Guard
    if (hasEligibility && !confirmedEligibility) {
        alert("Please confirm your eligibility.");
        return;
    }

    setLoading(true);

    try {
      if (mode === 'solo') {
        await registerForEvent(event.id, user);
        alert("✅ Registration Successful!");
      } 
      else if (mode === 'create_team') {
        const res = await registerTeam(event.id, user, teamName);
        alert(`✅ Team Created! Your Code: ${res.teamCode}`);
      } 
      else if (mode === 'join_team') {
        await joinTeam(event.id, user, teamCode);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-black/20">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Register</h2>
            <p className="text-xs text-zinc-500">{event.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'choice' ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-zinc-500 mb-2">Select how you want to participate:</p>
              
              {/* Solo Option (Show if NOT purely a team event) */}
              {!isTeamEvent && (
                <button 
                  onClick={() => handleModeSelect('solo')}
                  className="w-full p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group text-left flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white">Individual Entry</h3>
                    <p className="text-xs text-zinc-500">I am participating alone</p>
                  </div>
                  <ArrowRight className="h-5 w-5 ml-auto text-zinc-300 group-hover:text-indigo-500" />
                </button>
              )}

              {/* Team Options */}
              {isTeamEvent && (
                <>
                  <button 
                    onClick={() => handleModeSelect('create_team')}
                    className="w-full p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white">Create a Team</h3>
                      <p className="text-xs text-zinc-500">I am the Team Leader</p>
                    </div>
                    <ArrowRight className="h-5 w-5 ml-auto text-zinc-300 group-hover:text-purple-500" />
                  </button>

                  <button 
                    onClick={() => handleModeSelect('join_team')}
                    className="w-full p-4 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center group-hover:text-zinc-900 dark:group-hover:text-white">
                      <Hash className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-700 dark:text-zinc-300">Join Existing Team</h3>
                      <p className="text-xs text-zinc-500">I have a Team Code</p>
                    </div>
                  </button>
                </>
              )}
            </div>
          ) : (
            /* FORM STEP */
            <form onSubmit={handleRegister} className="space-y-6">
              
              {/* Back Button for Team Mode */}
              {isTeamEvent && (
                <div className="flex items-center gap-2 mb-2">
                  <button type="button" onClick={() => setStep('choice')} className="text-xs font-bold text-zinc-500 hover:text-indigo-600 uppercase tracking-wide">
                    ← Back to Options
                  </button>
                </div>
              )}

              {/* NEW: ELIGIBILITY CHECK */}
              {hasEligibility && (
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-800/30">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                      <div>
                          <h4 className="font-bold text-amber-800 dark:text-amber-500 text-xs uppercase">Eligibility Restriction</h4>
                          <p className="text-sm text-amber-900 dark:text-amber-300 mt-1 font-medium">{event.eligibility}</p>
                      </div>
                    </div>
                    
                    <label className="flex items-center gap-3 mt-4 cursor-pointer p-2 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded-lg transition-colors">
                      <input 
                        type="checkbox" 
                        required 
                        className="w-5 h-5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                        checked={confirmedEligibility}
                        onChange={e => setConfirmedEligibility(e.target.checked)}
                      />
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        I confirm that I meet this criteria.
                      </span>
                    </label>
                </div>
              )}

              {mode === 'solo' && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-300 mb-1">Confirm Registration</h3>
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">
                    You are registering as an individual for <b>{event.title}</b>.
                  </p>
                </div>
              )}

              {mode === 'create_team' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Team Name</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                    <input required type="text" placeholder="e.g. The Code Warriors" className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                      value={teamName} onChange={e => setTeamName(e.target.value)} />
                  </div>
                </div>
              )}

              {mode === 'join_team' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Enter Team Code</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                    <input required type="text" placeholder="e.g. X7Y9" maxLength={6} className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono uppercase tracking-widest text-lg dark:text-white"
                      value={teamCode} onChange={e => setTeamCode(e.target.value.toUpperCase())} />
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading || (hasEligibility && !confirmedEligibility)}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Complete Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
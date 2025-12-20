import { useState } from 'react';
import { X, Loader2, Users, Trophy } from 'lucide-react';
import { registerTeam } from '../services/registrationService';
import { useAuth } from '../../../context/AuthContext';

const TeamRegisterModal = ({ event, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await registerTeam(event.id, currentUser, teamName);
      onSuccess(result.teamCode); // Pass the code back to the parent
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold">
            <Trophy className="h-5 w-5" />
            <span>Create Your Team</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleCreateTeam} className="p-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            You are registering as the <strong>Team Leader</strong> for {event.title}.
          </p>

          <div className="mb-4">
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Team Name</label>
            <input 
              required
              autoFocus
              type="text"
              placeholder="e.g. The Avengers"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Team & Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeamRegisterModal;
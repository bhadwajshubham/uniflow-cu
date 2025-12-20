import { useState } from 'react';
import { X, Loader2, Users } from 'lucide-react';
import { joinTeam } from '../services/registrationService';
import { useAuth } from '../../../context/AuthContext';

const JoinTeamModal = ({ event, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await joinTeam(event.id, currentUser, code.toUpperCase());
      onSuccess(result.teamName); // Pass team name back
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
            <Users className="h-5 w-5 text-indigo-500" />
            <span>Join Existing Team</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleJoin} className="p-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Enter the code shared by your Team Leader.
          </p>

          <div className="mb-4">
            <input 
              required
              autoFocus
              type="text"
              placeholder="e.g. A9X1"
              maxLength={6}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-center text-2xl font-mono font-black tracking-widest text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg font-medium text-center">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading || code.length < 4}
            className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join Team'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinTeamModal;
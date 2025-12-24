import { useState } from 'react';
import { X, Megaphone, Loader2, AlertTriangle } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const PostAnnouncementModal = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info'); // 'info' or 'urgent'

  const handlePost = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        message: message,
        type: type,
        createdAt: serverTimestamp()
      });
      
      alert("Announcement Posted Live!");
      onClose();
      // Reload not needed for real-time listeners, but good for safety
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert("Failed to post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
          <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <Megaphone className="h-5 w-5" /> Broadcast Message
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handlePost} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Message</label>
            <textarea 
              rows="3"
              required
              placeholder="e.g. Hackathon Registration closes in 1 hour!"
              className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Alert Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setType('info')}
                className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'info' 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-500'
                }`}
              >
                ℹ️ Info
              </button>
              <button 
                type="button"
                onClick={() => setType('urgent')}
                className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'urgent' 
                    ? 'bg-red-600 text-white border-red-600' 
                    : 'bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-500'
                }`}
              >
                ⚠️ Urgent
              </button>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post to Website'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default PostAnnouncementModal;
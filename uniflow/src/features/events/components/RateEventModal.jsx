import React, { useState } from 'react';
import { Star, X, Loader2, Send } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';

const RateEventModal = ({ isOpen, onClose, eventTitle, eventId }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert("Please select a star rating!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        eventId,
        eventTitle,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        rating,
        comment,
        createdAt: serverTimestamp()
      });
      
      alert("Thanks for your feedback! ⭐");
      onClose();
      setRating(0); // Reset form
      setComment('');
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
          <X className="w-4 h-4 text-zinc-500" />
        </button>

        <div className="text-center mb-6">
           <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-3 text-yellow-500">
             <Star className="w-6 h-6 fill-current" />
           </div>
           <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">Rate Experience</h3>
           <p className="text-xs text-zinc-500 font-bold">{eventTitle || 'Event'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           
           {/* Star Interaction */}
           <div className="flex justify-center gap-2">
             {[1, 2, 3, 4, 5].map((star) => (
               <button
                 type="button"
                 key={star}
                 className="focus:outline-none transition-transform hover:scale-110 active:scale-90"
                 onClick={() => setRating(star)}
                 onMouseEnter={() => setHover(star)}
                 onMouseLeave={() => setHover(rating)}
               >
                 <Star 
                   className={`w-8 h-8 ${star <= (hover || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300 dark:text-zinc-700'}`} 
                 />
               </button>
             ))}
           </div>

           <textarea 
             placeholder="What did you like? What can we improve?"
             className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl text-sm font-medium dark:text-white outline-none resize-none h-24 focus:ring-2 focus:ring-yellow-500/20"
             value={comment}
             onChange={(e) => setComment(e.target.value)}
           />

           <button 
             type="submit" 
             disabled={loading} 
             className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
           >
             {loading ? <Loader2 className="animate-spin" /> : <><Send className="w-4 h-4" /> Submit Review</>}
           </button>
        </form>

      </div>
    </div>
  );
};

export default RateEventModal;
import { useState } from 'react';
import { X, Star, Loader2, MessageSquare } from 'lucide-react';
import { submitReview } from '../services/feedbackService';
import { useAuth } from '../../../context/AuthContext';

const ReviewModal = ({ ticket, onClose }) => {
  const { currentUser } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0); // For star hover effect
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a star rating.");
      return;
    }
    
    setLoading(true);
    try {
      await submitReview(ticket.eventId, currentUser, rating, comment);
      alert("Thank you for your feedback!");
      onClose();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-black/20">
          <h2 className="font-bold text-zinc-900 dark:text-white">Rate Event</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-zinc-500 mb-1">How was your experience at</p>
            <h3 className="font-bold text-lg text-indigo-600 dark:text-indigo-400 leading-tight">
              {ticket.eventTitle}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Star Rating Input */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(rating)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    className={`h-8 w-8 transition-colors duration-200 
                      ${star <= (hover || rating) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-zinc-300 dark:text-zinc-700'
                      }`} 
                  />
                </button>
              ))}
            </div>
            
            <div className="text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
              {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : rating === 1 ? 'Terrible' : 'Select Rating'}
            </div>

            {/* Comment Box */}
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <textarea 
                rows="3"
                placeholder="Share your thoughts (optional)..."
                className="w-full pl-9 pr-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <button 
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Review'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ReviewModal;
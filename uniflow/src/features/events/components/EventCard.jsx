import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight, Edit, Trash2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { deleteDoc, doc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const EventCard = ({ event, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isOrganizer = user && event.organizerId === user.uid;

  const handleDelete = async (e) => {
    e.stopPropagation(); // Stop card click
    if (window.confirm("Are you sure you want to delete this event? This cleans up all tickets.")) {
      try {
        const q = query(collection(db, 'registrations'), where('eventId', '==', event.id));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        await deleteDoc(doc(db, 'events', event.id));
        if (onDelete) onDelete(); // Refresh parent list
      } catch (err) {
        console.error("Delete Error", err);
        alert("Failed to delete event.");
      }
    }
  };

  return (
    <div 
      onClick={() => navigate(`/events/${event.id}`)} 
      className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative"
    >
      {/* Edit/Delete Controls for Organizer */}
      {isOrganizer && (
        <div className="absolute top-4 right-4 flex gap-2 z-20">
           <button 
             onClick={(e) => { e.stopPropagation(); onEdit(event); }} 
             className="p-2 bg-white/90 text-indigo-600 rounded-full shadow-sm hover:bg-white transition-colors"
           >
             <Edit className="w-4 h-4" />
           </button>
           <button 
             onClick={handleDelete} 
             className="p-2 bg-white/90 text-red-600 rounded-full shadow-sm hover:bg-white transition-colors"
           >
             <Trash2 className="w-4 h-4" />
           </button>
        </div>
      )}

      {/* Image & Content (Rest is same as standard design) */}
      <div className="h-48 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
         {event.imageUrl ? (
           <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
         ) : (
           <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20"><Calendar className="w-12 h-12 opacity-50" /></div>
         )}
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 line-clamp-1">{event.title}</h3>
        <div className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400 mb-6">
           <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-500" /><span>{event.date}</span></div>
           <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" /><span>{event.location}</span></div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
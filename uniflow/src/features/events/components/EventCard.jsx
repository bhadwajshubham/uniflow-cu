import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight, Edit, Trash2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const EventCard = ({ event, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 🔒 SECURE CHECK: Only the creator sees these buttons
  const isOrganizer = user && event.organizerId === user.uid;

  const handleDelete = async (e) => {
    e.stopPropagation(); // Stop card click
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteDoc(doc(db, 'events', event.id));
        if (onDelete) onDelete(); // Refresh parent list
      } catch (err) {
        alert("Failed to delete: " + err.message);
      }
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation(); // Stop card click
    if (onEdit) onEdit(event);
  };

  return (
    <div 
      onClick={() => navigate(`/events/${event.id}`)}
      className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative"
    >
      
      {/* 🛡️ ADMIN CONTROLS (Only visible to Creator) */}
      {isOrganizer && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button 
            onClick={handleEdit}
            className="p-2 bg-white/90 dark:bg-black/90 backdrop-blur text-indigo-600 rounded-lg shadow-sm hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors"
            title="Edit Event"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={handleDelete}
            className="p-2 bg-white/90 dark:bg-black/90 backdrop-blur text-red-500 rounded-lg shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete Event"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Image Section */}
      <div className="h-48 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
        {/* Price Badge */}
        <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-black/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-700 shadow-sm">
          {event.price > 0 ? `₹${event.price}` : 'Free'}
        </div>

        {/* Organizer Badge (Optional visual cue) */}
        {isOrganizer && (
          <div className="absolute bottom-4 right-4 z-10 bg-indigo-600/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1 shadow-md">
            <ShieldCheck className="w-3 h-3" /> YOUR EVENT
          </div>
        )}

        {event.imageUrl ? (
          <img 
            src={event.imageUrl} 
            alt={event.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <Calendar className="w-12 h-12 opacity-50" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 line-clamp-1">
          {event.title}
        </h3>
        
        <div className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-500" />
            <span>{event.location || 'Venue TBA'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-xs font-medium text-zinc-400">
            {event.ticketsSold || 0} attending
          </span>
          <span className="flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
            Details <ArrowRight className="w-4 h-4 ml-1" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
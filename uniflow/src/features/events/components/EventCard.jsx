import { Calendar, MapPin, Users, Edit, Ticket, Zap } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const EventCard = ({ event, onRegister, onManage }) => {
  const { userRole, currentUser } = useAuth();
  
  // Logic to show "Manage" button: If user is admin AND (it's their event OR they are Super Admin)
  const isOwner = event.organizerId === currentUser?.uid;
  // Assuming Super Admin email is fixed or we trust all admins for now based on your logic
  const canManage = userRole === 'admin' && (isOwner || currentUser?.email === 'shubham1293.be23@chitkara.edu.in');

  const soldPercentage = Math.min((event.ticketsSold / event.totalTickets) * 100, 100);
  const isSoldOut = event.ticketsSold >= event.totalTickets;

  return (
    <div className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      
      {/* IMAGE SECTION */}
      <div className="relative h-48 overflow-hidden">
        {event.imageUrl ? (
          <img 
            src={event.imageUrl} 
            alt={event.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Ticket className="h-12 w-12 text-white/50" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700">
           {isSoldOut ? 'SOLD OUT' : `${event.ticketsSold} / ${event.totalTickets} Sold`}
        </div>

        {/* SPONSOR BADGE (NEW) */}
        {event.sponsorName && (
           <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white border border-white/20 flex items-center gap-1 shadow-lg">
              <Zap className="h-3 w-3 text-yellow-400 fill-yellow-400" /> 
              <span>Powered by {event.sponsorName}</span>
           </div>
        )}
      </div>

      {/* CONTENT SECTION */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
           <div>
             <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{event.clubName}</span>
             <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
               {event.title}
             </h3>
           </div>
        </div>
        
        <p className="text-zinc-500 text-sm line-clamp-2 mb-4 flex-1">
          {event.description || "No description provided."}
        </p>

        {/* Details Grid */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
             <Calendar className="h-4 w-4 shrink-0" />
             <span>{new Date(event.date).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
             <MapPin className="h-4 w-4 shrink-0" />
             <span>{event.location}</span>
          </div>
          {event.eligibility && (
             <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded w-fit mt-2">
                ⚠️ {event.eligibility}
             </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-6">
           <div className={`h-full ${isSoldOut ? 'bg-red-500' : 'bg-indigo-500'} transition-all duration-1000`} style={{ width: `${soldPercentage}%` }}></div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 mt-auto">
          {canManage ? (
            <button 
              onClick={() => onManage(event)}
              className="flex-1 py-3 rounded-xl font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white flex items-center justify-center gap-2 transition-colors"
            >
              <Edit className="h-4 w-4" /> Manage
            </button>
          ) : (
            <button 
              onClick={() => onRegister(event)}
              disabled={isSoldOut}
              className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${isSoldOut ? 'bg-zinc-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25'}`}
            >
              {isSoldOut ? 'Sold Out' : 'Get Ticket'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default EventCard;
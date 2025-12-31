import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, Trophy, Zap } from 'lucide-react';

const EventCard = ({ event }) => {
  const navigate = useNavigate();
  
  // Stats Calculation
  const percentSold = Math.min(100, Math.round((event.ticketsSold / event.totalTickets) * 100));
  const isSoldOut = percentSold >= 100;
  const isSellingFast = !isSoldOut && percentSold > 70;

  // Date Formatting
  const dateObj = new Date(event.date);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();

  return (
    <div className="group h-[26rem] w-full [perspective:1000px] cursor-pointer">
      
      <div className="relative h-full w-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
        
        {/* ==============================
            SIDE A: FRONT (Clean & Readable)
           ============================== */}
        <div className="absolute inset-0 h-full w-full rounded-[2rem] overflow-hidden shadow-xl [backface-visibility:hidden] bg-zinc-900 border border-zinc-800">
          
          {/* Background Image */}
          {event.imageUrl ? (
            <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${getCategoryGradient(event.category)} opacity-60`}></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
             <div className="flex flex-col items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white shadow-lg">
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{month}</span>
                <span className="text-2xl font-black leading-none mt-1">{day}</span>
             </div>

             <div className="px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
                <Trophy className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">{event.organizerName || 'Club'}</span>
             </div>
          </div>

          {/* Bottom Bar */}
          <div className="absolute bottom-0 left-0 w-full p-6">
             <div className="flex gap-2 mb-2">
                <span className="px-2 py-1 rounded-md bg-indigo-600 text-[9px] font-bold text-white uppercase tracking-widest">
                  {event.category}
                </span>
                {isSellingFast && (
                  <span className="px-2 py-1 rounded-md bg-red-500 text-[9px] font-bold text-white uppercase tracking-widest animate-pulse">
                    Selling Fast
                  </span>
                )}
             </div>

             {/* Removed 'italic', kept it upright for readability */}
             <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight mb-3 line-clamp-2">
               {event.title}
             </h3>

             <div className="flex items-center justify-between border-t border-white/20 pt-3">
                <div className="flex items-center gap-2 text-white/80">
                   <MapPin className="w-4 h-4" />
                   <span className="text-xs font-bold uppercase truncate max-w-[120px]">{event.location}</span>
                </div>
                <div className="text-xl font-black text-white">
                   {event.price > 0 ? `₹${event.price}` : 'FREE'}
                </div>
             </div>
          </div>
        </div>

        {/* ==============================
            SIDE B: BACK (Data & Action)
           ============================== */}
        <div className="absolute inset-0 h-full w-full rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-2xl flex flex-col">
          
          {/* Top Info */}
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-zinc-800 rounded-xl text-indigo-600">
                   <Clock className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-zinc-400 uppercase">Starts At</p>
                   <p className="font-bold text-zinc-900 dark:text-white text-lg">{event.time}</p>
                </div>
             </div>
             
             {/* 🛠️ FIX: Vertical Stack for Availability to prevent overflow */}
             <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Availability</p>
                <div className="flex flex-col items-end leading-none">
                   <span className={`font-black text-lg ${isSoldOut ? 'text-red-500' : 'text-green-500'}`}>
                     {isSoldOut ? 'FULL' : (event.totalTickets - event.ticketsSold)}
                   </span>
                   <span className="text-[10px] font-bold text-zinc-400">
                     / {event.totalTickets} Seats
                   </span>
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar mb-6">
             <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
               {event.description || "Join us for an amazing experience."}
             </p>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`); }}
            disabled={isSoldOut}
            className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${
              isSoldOut 
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                : 'bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-95 shadow-xl'
            }`}
          >
            {isSoldOut ? 'Sold Out' : <>Book Seat <ArrowRight className="w-4 h-4" /></>}
          </button>

        </div>
      </div>
    </div>
  );
};

// Gradient Helper
const getCategoryGradient = (category) => {
  switch (category) {
    case 'Tech': return 'from-blue-600 to-cyan-600';
    case 'Cultural': return 'from-pink-600 to-rose-600';
    case 'Sports': return 'from-orange-600 to-amber-600';
    default: return 'from-indigo-600 to-purple-600';
  }
};

export default EventCard;
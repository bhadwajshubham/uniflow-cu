import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowRight, Users, Ticket, Zap } from 'lucide-react';

const EventCard = ({ event }) => {
  const navigate = useNavigate();
  
  // Calculate percentage for the progress bar
  const percentSold = Math.min(100, Math.round((event.ticketsSold / event.totalTickets) * 100));
  const isSoldOut = percentSold >= 100;

  return (
    // 1. THE 3D SCENE CONTAINER
    <div className="group h-[28rem] w-full [perspective:1000px] cursor-pointer">
      
      {/* 2. THE FLIPPING FLAPPER (Transition Wrapper) */}
      <div className="relative h-full w-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
        
        {/* ==============================
            3. SIDE A: THE CINEMATIC FRONT
           ============================== */}
        <div className="absolute inset-0 h-full w-full rounded-[2rem] overflow-hidden shadow-xl [backface-visibility:hidden]">
          
          {/* Poster Image */}
          {event.imageUrl ? (
            <img 
              src={event.imageUrl} 
              alt={event.title} 
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
          ) : (
            // Fallback Abstract Art if no image
            <div className={`h-full w-full bg-gradient-to-br ${getCategoryGradient(event.category)} relative`}>
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <div className="flex items-center justify-center h-full">
                  <h1 className="text-4xl font-black text-white/20 uppercase tracking-widest -rotate-45 select-none">{event.category}</h1>
               </div>
            </div>
          )}

          {/* Glass Overlay (Front) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
          
          {/* Front Content */}
          <div className="absolute bottom-0 left-0 w-full p-8 text-white">
             <div className="flex items-center gap-2 mb-3">
               <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest">
                 {event.category}
               </span>
               {event.isUniversityOnly && (
                 <span className="px-3 py-1 rounded-full bg-red-500/80 backdrop-blur-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                   <Zap className="w-3 h-3 fill-current" /> Chitkara Only
                 </span>
               )}
             </div>
             <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-1 shadow-black drop-shadow-lg">{event.title}</h3>
             <p className="text-xs font-bold text-white/70 uppercase tracking-widest">{event.organizerName}</p>
          </div>
        </div>

        {/* ==============================
            4. SIDE B: THE DATA DASHBOARD (Rotated 180)
           ============================== */}
        <div className="absolute inset-0 h-full w-full rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-2xl flex flex-col justify-between overflow-hidden">
          
          {/* Decorative BG Blob */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>

          {/* Top: Header */}
          <div className="relative z-10">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Event Dossier</p>
             
             <div className="space-y-4">
                <div className="flex items-start gap-4">
                   <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-indigo-600">
                      <Calendar className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase">Date & Time</p>
                      <p className="font-black text-zinc-900 dark:text-white">{event.date}</p>
                      <p className="text-xs font-medium text-zinc-500">{event.time}</p>
                   </div>
                </div>

                <div className="flex items-start gap-4">
                   <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-purple-600">
                      <MapPin className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase">Venue</p>
                      <p className="font-black text-zinc-900 dark:text-white line-clamp-1">{event.location}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Middle: Stats */}
          <div className="relative z-10 py-6 border-t border-b border-zinc-100 dark:border-zinc-800 my-2">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase text-zinc-400">Availability</span>
                <span className={`text-[10px] font-black uppercase ${isSoldOut ? 'text-red-500' : 'text-green-500'}`}>
                  {isSoldOut ? 'Sold Out' : `${event.totalTickets - event.ticketsSold} Left`}
                </span>
             </div>
             <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${isSoldOut ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`} 
                  style={{ width: `${percentSold}%` }}
                ></div>
             </div>
          </div>

          {/* Bottom: Action */}
          <div className="relative z-10 mt-auto">
             <div className="flex justify-between items-end mb-4">
                <div>
                   <p className="text-[10px] font-black text-zinc-400 uppercase">Entry Fee</p>
                   <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">
                     {event.price > 0 ? `₹${event.price}` : 'FREE'}
                   </p>
                </div>
             </div>
             
             <button 
               onClick={() => navigate(`/events/${event.id}`)}
               className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group/btn"
             >
               View Details <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

// Helper for dynamic colors based on category
const getCategoryGradient = (category) => {
  switch (category) {
    case 'Tech': return 'from-blue-600 to-cyan-500';
    case 'Cultural': return 'from-pink-600 to-rose-500';
    case 'Sports': return 'from-orange-600 to-amber-500';
    default: return 'from-indigo-600 to-purple-500';
  }
};

export default EventCard;
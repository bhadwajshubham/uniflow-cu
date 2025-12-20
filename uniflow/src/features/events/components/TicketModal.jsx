import { useRef } from 'react';
import { X, Download, MapPin, Calendar, User, Mail } from 'lucide-react';
import QRCode from 'react-qr-code';

const TicketModal = ({ ticket, event, onClose }) => {
  const ticketRef = useRef();

  // Simple "Download" by printing (simplest way without heavy PDF libraries)
  const handleDownload = () => {
    window.print();
  };

  if (!ticket || !event) return null;

  const dateObj = new Date(event.date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0">
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl print:shadow-none print:w-full print:max-w-none">
        
        {/* Close Button (Hide when printing) */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors print:hidden"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 1. TICKET HEADER (Event Image/Gradient) */}
        <div className="h-32 bg-gradient-to-br from-indigo-600 to-purple-700 relative flex items-center justify-center">
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
           <h2 className="text-2xl font-black text-white tracking-tight text-center px-4 relative z-10 drop-shadow-md">
             {event.title}
           </h2>
        </div>

        {/* 2. TICKET BODY */}
        <div className="p-6 relative">
          {/* Rip/Tear Effect Circles */}
          <div className="absolute -top-3 left-0 w-6 h-6 bg-black/80 dark:bg-black rounded-full translate-x-[-50%]" />
          <div className="absolute -top-3 right-0 w-6 h-6 bg-black/80 dark:bg-black rounded-full translate-x-[50%]" />

          {/* Event Details */}
          <div className="space-y-4 mb-8">
             <div className="flex items-start gap-3">
               <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                 <Calendar className="h-5 w-5" />
               </div>
               <div>
                 <p className="text-xs font-bold text-zinc-400 uppercase">Date & Time</p>
                 <p className="font-semibold text-zinc-900 dark:text-white">
                   {dateObj.toLocaleDateString()} • {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </p>
               </div>
             </div>

             <div className="flex items-start gap-3">
               <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                 <MapPin className="h-5 w-5" />
               </div>
               <div>
                 <p className="text-xs font-bold text-zinc-400 uppercase">Location</p>
                 <p className="font-semibold text-zinc-900 dark:text-white">{event.location}</p>
               </div>
             </div>

             <div className="flex items-start gap-3">
               <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                 <User className="h-5 w-5" />
               </div>
               <div>
                 <p className="text-xs font-bold text-zinc-400 uppercase">Attendee</p>
                 <p className="font-semibold text-zinc-900 dark:text-white">{ticket.userName}</p>
                 <p className="text-xs text-zinc-500">{ticket.userEmail}</p>
               </div>
             </div>
          </div>

          {/* 3. QR CODE SECTION */}
          <div className="border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 pt-8 pb-4 flex flex-col items-center justify-center">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-zinc-100">
              <QRCode 
                value={JSON.stringify({
                  ticketId: ticket.ticketId || ticket.id, // Fallback if id is stored differently
                  email: ticket.userEmail,
                  eventId: event.id
                })} 
                size={160}
                level="M" 
              />
            </div>
            <p className="mt-4 text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
              Ticket ID: {ticket.id?.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* 4. FOOTER ACTIONS (Hide when printing) */}
          <div className="mt-4 pt-4 print:hidden">
            <button 
              onClick={handleDownload}
              className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Download className="h-4 w-4" /> Download Pass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
import { useState, useEffect } from 'react';
import { MapPin, Loader2, CheckCircle, Lock, Users, Copy, Trophy, Check, Settings, QrCode } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { registerForEvent } from '../services/registrationService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import TeamRegisterModal from './TeamRegisterModal';
import JoinTeamModal from './JoinTeamModal'; 
import ManageEventModal from './ManageEventModal';
import TicketModal from './TicketModal'; // <-- NEW IMPORT

const EventCard = ({ event }) => {
  const { currentUser, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); 
  const [ticketData, setTicketData] = useState(null); 
  const [liveSold, setLiveSold] = useState(event.ticketsSold || 0);
  
  // Modals
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false); // <-- Ticket Modal State
  
  // UI State
  const [teamCode, setTeamCode] = useState(null); 
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'events', event.id), (doc) => {
      if (doc.exists()) setLiveSold(doc.data().ticketsSold || 0);
    });
    return () => unsub();
  }, [event.id]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'registrations', `${event.id}_${currentUser.uid}`), (doc) => {
      if (doc.exists()) {
        setStatus('registered');
        setTicketData({ id: doc.id, ...doc.data() }); // Ensure we capture the ID for the QR
      }
    });
    return () => unsub();
  }, [currentUser, event.id]);

  const handleRegisterClick = async () => {
    if (!currentUser) return alert("Please Login First");
    
    if (event.participationType === 'team') {
      setShowTeamModal(true);
      return;
    }

    setLoading(true);
    try {
      await registerForEvent(event.id, currentUser);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSuccess = (code) => {
    setShowTeamModal(false);
    setTeamCode(code); 
  };

  const handleCopyCode = () => {
    if (ticketData?.teamCode) {
      navigator.clipboard.writeText(ticketData.teamCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); 
    }
  };

  const dateObj = new Date(event.date);
  const isSoldOut = liveSold >= parseInt(event.totalTickets);
  const isRestricted = event.isRestricted && currentUser && !currentUser.email.endsWith('chitkara.edu.in');
  const remaining = parseInt(event.totalTickets) - liveSold;

  return (
    <>
      <div className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col h-full relative">
        
        {/* SUCCESS OVERLAY */}
        {teamCode && (
          <div className="absolute inset-0 z-20 bg-emerald-600 flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in">
            <CheckCircle className="h-12 w-12 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Team Registered!</h3>
            <p className="text-emerald-100 mb-6 text-sm">Share this code with your teammates:</p>
            <div className="bg-white/20 p-4 rounded-xl flex flex-col gap-2 w-full">
              <span className="font-mono text-3xl font-black tracking-widest">{teamCode}</span>
              <button onClick={() => {navigator.clipboard.writeText(teamCode); alert('Copied!')}} className="text-xs uppercase font-bold text-emerald-100 hover:text-white flex items-center justify-center gap-1">
                <Copy className="h-3 w-3" /> Copy Code
              </button>
            </div>
            <button onClick={() => setTeamCode(null)} className="mt-8 text-sm font-semibold hover:underline">Close</button>
          </div>
        )}

        {/* HEADER */}
        <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          
          <div className="absolute top-4 right-4 flex gap-2">
             {/* ADMIN BUTTON */}
             {userRole === 'admin' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowManageModal(true); }}
                  className="bg-black/50 hover:bg-black/80 backdrop-blur-sm p-1.5 rounded-full text-white transition-colors border border-white/20"
                  title="Manage Attendees"
                >
                  <Settings className="h-4 w-4" />
                </button>
             )}

             <div className="bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
               {event.category}
             </div>
             {event.participationType === 'team' && (
               <div className="bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded-full text-indigo-700 dark:text-indigo-400 flex items-center gap-1" title="Team Event">
                 <Users className="h-3 w-3" />
               </div>
             )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1 line-clamp-1">{event.title}</h3>
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <MapPin className="h-4 w-4" /> <span className="line-clamp-1">{event.location}</span>
              </div>
            </div>
            <div className="text-center px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0">
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">{dateObj.toLocaleString('default', { month: 'short' })}</div>
              <div className="text-lg font-black text-zinc-900 dark:text-white">{dateObj.getDate()}</div>
            </div>
          </div>

          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-6 h-10">{event.description}</p>

          <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold text-zinc-400">Availability</span>
               <span className={`text-sm font-semibold ${isSoldOut ? 'text-red-500' : 'text-emerald-500'}`}>
                 {isSoldOut ? 'Sold Out' : `${remaining} ${event.participationType === 'team' ? 'Teams' : 'Left'}`}
               </span>
            </div>

            {/* BUTTON LOGIC */}
            {status === 'registered' ? (
              // REGISTERED: Show Code or QR Button
              ticketData?.type === 'team_leader' ? (
                 <div className="flex flex-col items-end gap-2">
                   {/* 1. Team Code Box */}
                   <div>
                     <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-t-lg border border-indigo-200 dark:border-indigo-800 border-b-0 flex items-center gap-1">
                       <Trophy className="h-3 w-3" /> Team Code
                     </div>
                     <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-b-lg rounded-tl-none overflow-hidden">
                       <span className="px-3 py-1.5 font-mono font-black text-sm tracking-widest text-zinc-900 dark:text-white select-all">
                         {ticketData.teamCode || '....'}
                       </span>
                       <button 
                          onClick={handleCopyCode}
                          className="px-2 py-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border-l border-zinc-200 dark:border-zinc-700"
                          title="Copy Code"
                       >
                          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-zinc-400" />}
                       </button>
                     </div>
                   </div>
                   
                   {/* 2. View Pass Button (For Leader too) */}
                   <button 
                      onClick={() => setShowTicketModal(true)}
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                   >
                     <QrCode className="h-3 w-3" /> View Pass
                   </button>
                 </div>
              ) : (
                // Individual/Member: Show QR Button
                <button 
                  onClick={() => setShowTicketModal(true)}
                  className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  <QrCode className="h-4 w-4" /> View Ticket
                </button>
              )
            ) : isSoldOut ? (
               <button disabled className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-sm font-bold rounded-lg cursor-not-allowed">Sold Out</button>
            ) : isRestricted ? (
               <button disabled className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-500 text-sm font-bold rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-2 cursor-not-allowed"><Lock className="h-3 w-3" /> Students Only</button>
            ) : (
              // UNREGISTERED
              <div className="flex flex-col gap-2 w-full">
                <button 
                  onClick={handleRegisterClick}
                  disabled={loading}
                  className="w-full px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-bold rounded-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (event.participationType === 'team' ? 'Create Team' : 'Register Free')}
                </button>

                {event.participationType === 'team' && !loading && (
                  <button 
                    onClick={() => setShowJoinModal(true)}
                    className="text-xs text-center text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-2"
                  >
                    Have a Team Code? Join here
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ALL MODALS */}
      {showTeamModal && (
        <TeamRegisterModal 
          event={event} 
          onClose={() => setShowTeamModal(false)} 
          onSuccess={handleTeamSuccess} 
        />
      )}

      {showJoinModal && (
        <JoinTeamModal 
          event={event}
          onClose={() => setShowJoinModal(false)}
          onSuccess={(teamName) => {
            setShowJoinModal(false);
            alert(`Successfully joined team: ${teamName}`);
          }}
        />
      )}

      {showManageModal && (
        <ManageEventModal 
          event={event} 
          onClose={() => setShowManageModal(false)} 
        />
      )}

      {showTicketModal && (
        <TicketModal 
          ticket={ticketData}
          event={event}
          onClose={() => setShowTicketModal(false)}
        />
      )}
    </>
  );
};

export default EventCard;
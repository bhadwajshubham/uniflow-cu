import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { ArrowLeft, Calendar, Clock, MapPin, Share2, Download, User, Users } from 'lucide-react';

const TicketPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const docRef = doc(db, 'registrations', ticketId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTicket({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Pass...</div>;
  if (!ticket) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Ticket not found</div>;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 pointer-events-none"></div>
      
      {/* Header */}
      <div className="absolute top-6 left-6 z-10">
        <button onClick={() => navigate('/my-tickets')} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Ticket Card */}
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-500">
        
        {/* Header Gradient */}
        <div className="h-48 bg-gradient-to-r from-indigo-600 to-purple-600 relative p-6 flex flex-col justify-end">
          <div className="absolute top-6 right-6 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10">
            {ticket.type === 'team_leader' || ticket.type === 'team_member' ? 'TEAM PASS' : 'SOLO PASS'}
          </div>
          <h1 className="text-3xl font-black text-white leading-tight drop-shadow-md">
            {ticket.eventTitle}
          </h1>
          <p className="text-indigo-100 text-sm mt-1 flex items-center gap-2">
            Organized by {ticket.organizerName || 'UniFlow Club'}
          </p>
        </div>

        <div className="p-8">
          
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Date</p>
              <p className="font-semibold text-zinc-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" /> {ticket.eventDate}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Time</p>
              <p className="font-semibold text-zinc-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" /> TBA
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Venue</p>
              <p className="font-semibold text-zinc-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" /> {ticket.eventLocation}
              </p>
            </div>
          </div>

          {/* User Details */}
          <div className="bg-zinc-50 rounded-2xl p-4 mb-8 border border-zinc-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">{ticket.userName}</p>
                <p className="text-xs text-zinc-500">{ticket.userEmail}</p>
              </div>
            </div>
            {ticket.teamName && (
              <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase">Team</span>
                <span className="text-sm font-bold text-purple-600 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {ticket.teamName} ({ticket.teamCode})
                </span>
              </div>
            )}
          </div>

          {/* 🔳 CORRECT QR GENERATION (ID ONLY) */}
          <div className="flex flex-col items-center justify-center">
            <div className="p-4 bg-white border-4 border-zinc-900 rounded-3xl shadow-sm">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticket.id}`} 
                alt="Ticket QR" 
                className="w-48 h-48 object-contain"
              />
            </div>
            <p className="text-[10px] font-mono text-zinc-400 mt-4 uppercase tracking-widest">
              Ticket ID: {ticket.id}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-zinc-50 p-6 flex gap-3 border-t border-zinc-100">
          <button className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors">
            <Download className="w-4 h-4" /> Save
          </button>
          <button className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 transition-colors">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

      </div>
    </div>
  );
};

export default TicketPage;
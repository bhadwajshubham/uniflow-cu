import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import QRCode from 'react-qr-code'; // npm i react-qr-code
import { ArrowLeft, Calendar, MapPin, Clock, Download, Lock } from 'lucide-react';
import CertificateModal from './CertificateModal'; // Assuming you have this

const TicketPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const docRef = doc(db, 'registrations', ticketId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTicket({ id: docSnap.id, ...docSnap.data() });
        } else {
          alert("Ticket not found");
          navigate('/my-tickets');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId, navigate]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6 flex flex-col items-center relative">
      
      {/* Back Button */}
      <button onClick={() => navigate('/my-tickets')} className="absolute top-6 left-6 p-2 bg-zinc-800 rounded-full">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <h1 className="text-xl font-black uppercase tracking-widest mb-8 mt-2">Access Pass</h1>

      {/* Ticket Card */}
      <div className="bg-white text-black w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        
        {/* Event Header */}
        <div className="bg-indigo-600 p-6 text-center text-white">
           <h2 className="text-2xl font-black leading-none mb-2">{ticket.eventTitle}</h2>
           <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Official Entry Ticket</p>
        </div>

        {/* QR Section */}
        <div className="p-8 flex flex-col items-center justify-center border-b-2 border-dashed border-zinc-200 relative">
           {/* Punch Holes Effect */}
           <div className="absolute -left-4 bottom-[-12px] w-8 h-8 bg-zinc-900 rounded-full"></div>
           <div className="absolute -right-4 bottom-[-12px] w-8 h-8 bg-zinc-900 rounded-full"></div>

           {/* QR Code */}
           <div className="p-4 bg-white border-4 border-black rounded-2xl">
             {/* 🟢 QR VALUE IS NOW JUST THE TICKET ID FOR SECURITY */}
             <QRCode value={ticket.id} size={160} />
           </div>
           <p className="mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Scan at Entrance</p>
           
           {/* Status Badge */}
           <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${ticket.used ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
             {ticket.used ? 'Entry Verified' : 'Admit One'}
           </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4 bg-zinc-50">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center"><Calendar className="w-4 h-4 text-zinc-500" /></div>
             <div><p className="text-[10px] font-black uppercase text-zinc-400">Date</p><p className="text-sm font-bold">{ticket.eventDate}</p></div>
           </div>
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center"><MapPin className="w-4 h-4 text-zinc-500" /></div>
             <div><p className="text-[10px] font-black uppercase text-zinc-400">Location</p><p className="text-sm font-bold">{ticket.eventLocation}</p></div>
           </div>
           
           {/* User Info */}
           <div className="pt-4 border-t border-zinc-200">
             <p className="text-center text-xs font-bold text-zinc-400">Ticket Holder</p>
             <p className="text-center text-lg font-black text-indigo-900">{ticket.userName}</p>
             <p className="text-center text-[10px] font-bold text-zinc-400">{ticket.userRollNo}</p>
           </div>
        </div>

        {/* 🏆 CERTIFICATE UNLOCK (Logic Fix) */}
        <div onClick={() => ticket.used && setShowCertificate(true)} 
             className={`p-4 text-center cursor-pointer transition-colors ${ticket.used ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}>
          <div className="flex items-center justify-center gap-2">
            {ticket.used ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span className="text-xs font-black uppercase tracking-widest">
              {ticket.used ? 'Download Certificate' : 'Attend to Unlock'}
            </span>
          </div>
        </div>

      </div>

      {/* Render Certificate Modal */}
      {showCertificate && (
        <CertificateModal 
          isOpen={showCertificate} 
          onClose={() => setShowCertificate(false)} 
          ticket={ticket} 
        />
      )}

    </div>
  );
};

export default TicketPage;
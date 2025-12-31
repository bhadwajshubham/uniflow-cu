import React from 'react';
import { X, Download, Share2, Award, CheckCircle } from 'lucide-react';

const CertificateModal = ({ isOpen, onClose, userName, eventTitle, eventDate, ticketId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      
      {/* Container to maintain aspect ratio */}
      <div className="relative w-full max-w-4xl bg-white text-black rounded-xl overflow-hidden shadow-2xl transform transition-all scale-100">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors">
          <X className="w-5 h-5 text-black" />
        </button>

        {/* 📜 THE CERTIFICATE CANVAS */}
        <div className="relative p-12 md:p-16 border-[16px] border-double border-zinc-100 bg-[#FFFCF5]">
          
          {/* Decorative Gold Border */}
          <div className="absolute inset-4 border-2 border-[#D4AF37] opacity-50 pointer-events-none"></div>
          <div className="absolute inset-6 border border-[#D4AF37] opacity-30 pointer-events-none"></div>

          {/* Corner Ornaments (CSS Shapes) */}
          <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-[#D4AF37]"></div>
          <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-[#D4AF37]"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-[#D4AF37]"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-[#D4AF37]"></div>

          <div className="text-center space-y-6 relative z-10">
            
            {/* Header */}
            <div className="space-y-2">
              <div className="flex justify-center mb-4">
                 <Award className="w-12 h-12 text-[#D4AF37]" />
              </div>
              <h2 className="text-sm font-black tracking-[0.4em] uppercase text-[#D4AF37]">Chitkara University</h2>
              <h1 className="text-4xl md:text-6xl font-serif text-zinc-900 tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>
                Certificate of Participation
              </h1>
              <p className="text-zinc-500 italic font-serif">is hereby awarded to</p>
            </div>

            {/* User Name (Gold Gradient) */}
            <div className="py-4 border-b-2 border-zinc-200 w-2/3 mx-auto">
              <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] drop-shadow-sm">
                {userName || "Student Name"}
              </h3>
            </div>

            {/* Body Text */}
            <div className="space-y-2">
              <p className="text-zinc-600 text-lg font-medium">For successfully attending and actively participating in</p>
              <h4 className="text-2xl font-bold text-zinc-900 uppercase">{eventTitle || "Event Name"}</h4>
              <p className="text-zinc-500 font-medium">held on <span className="text-zinc-900 font-bold">{eventDate}</span></p>
            </div>

            {/* Footer / Signatures */}
            <div className="flex justify-between items-end pt-12 mt-8 px-12">
               <div className="text-center">
                 <div className="w-32 border-b border-black mb-2 mx-auto"></div>
                 <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Club President</p>
               </div>

               {/* Official Seal */}
               <div className="flex flex-col items-center">
                 <div className="w-20 h-20 rounded-full border-4 border-[#D4AF37] flex items-center justify-center bg-white shadow-xl relative">
                   <div className="absolute inset-1 border border-dashed border-[#D4AF37] rounded-full"></div>
                   <CheckCircle className="w-8 h-8 text-[#D4AF37]" />
                 </div>
                 <p className="text-[8px] font-mono text-zinc-400 mt-2 tracking-widest uppercase">Verified: {ticketId ? ticketId.slice(0,8) : '0000'}</p>
               </div>

               <div className="text-center">
                 <div className="w-32 border-b border-black mb-2 mx-auto"></div>
                 <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Faculty Mentor</p>
               </div>
            </div>

          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-zinc-900 p-4 flex justify-end gap-3">
          <button className="px-6 py-2 bg-zinc-800 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-700 flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button 
             onClick={() => alert("Downloading High-Res PDF...")} // Placeholder for PDF logic
             className="px-6 py-2 bg-[#D4AF37] text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:brightness-110 flex items-center gap-2 shadow-lg shadow-yellow-500/20"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>

      </div>
    </div>
  );
};

export default CertificateModal;
import React, { useRef, useState } from 'react';
import { X, Download, Share2, Award, ShieldCheck, CheckCircle, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CertificateModal = ({ isOpen, onClose, ticket }) => {
  const certificateRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !ticket) return null;

  // 🛠️ DATA MAPPING
  const studentName = ticket.userName || ticket.name || "Student Name";
  const eventName = ticket.eventTitle || ticket.eventName || "Event Name";
  const date = ticket.eventDate ? new Date(ticket.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString();
  const certId = ticket.id ? ticket.id.slice(0, 12).toUpperCase() : "UNIFLOW-CERT";

  // 🖨️ DOWNLOAD FUNCTION (High Quality)
  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setDownloading(true);
    
    try {
      // 1. Capture Canvas
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3, // 🔥 Ultra Sharp Quality
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // 2. Generate PDF
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificate_${studentName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Certificate error", err);
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      
      <div className="bg-zinc-900 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-zinc-800">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <h3 className="text-zinc-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" />
            Verified Credential
          </h3>
          <div className="flex gap-3">
            <button 
              onClick={handleDownload} 
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Download className="w-4 h-4" /> Download PDF</>}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 📜 CERTIFICATE PREVIEW AREA */}
        <div className="p-8 overflow-auto bg-zinc-900 flex justify-center items-center min-h-[400px]">
          
          {/* THE ACTUAL CERTIFICATE (Designed for A4 Landscape) */}
          <div 
            ref={certificateRef}
            className="w-[842px] h-[595px] bg-[#fffdf5] text-black relative flex flex-col shadow-2xl shrink-0 overflow-hidden"
            style={{ fontFamily: "'Times New Roman', serif" }}
          >
            {/* 🎨 ORNAMENTAL BORDER */}
            <div className="absolute inset-3 border-4 border-double border-zinc-800 pointer-events-none z-20"></div>
            <div className="absolute inset-5 border border-zinc-300 pointer-events-none z-20"></div>
            
            {/* CORNER ACCENTS */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-20"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-20 rotate-180"></div>

            {/* GOLD SIDE BAR */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-b from-yellow-700 via-yellow-400 to-yellow-700 z-10"></div>

            {/* CONTENT CONTAINER */}
            <div className="flex-1 flex flex-col items-center justify-between py-16 px-20 text-center relative z-10">
              
              {/* HEADER */}
              <div className="space-y-2">
                 <div className="flex items-center justify-center gap-3 mb-4 opacity-90">
                    <ShieldCheck className="w-8 h-8 text-indigo-900" />
                    <span className="text-sm font-sans font-bold tracking-[0.3em] uppercase text-zinc-500">Official Document</span>
                 </div>
                 <h1 className="text-5xl font-black uppercase tracking-widest text-indigo-950" style={{ fontFamily: 'serif' }}>
                    Certificate
                 </h1>
                 <p className="text-xl text-yellow-600 font-bold uppercase tracking-[0.4em] scale-y-75">
                    Of Participation
                 </p>
              </div>

              {/* BODY */}
              <div className="space-y-6 my-4">
                 <p className="text-lg text-zinc-500 font-sans italic">This certificate is proudly presented to</p>
                 
                 <h2 className="text-5xl font-bold text-black border-b-2 border-zinc-300 pb-4 px-10 inline-block min-w-[400px] italic" style={{ fontFamily: 'cursive' }}>
                    {studentName}
                 </h2>

                 <p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
                    For active participation and successful completion of <br/>
                    <strong className="text-2xl text-indigo-900 uppercase tracking-wide block mt-2">{eventName}</strong>
                 </p>
                 
                 <p className="text-md font-bold text-zinc-400 font-sans uppercase tracking-widest">
                    Held on {date}
                 </p>
              </div>

              {/* FOOTER */}
              <div className="w-full flex justify-between items-end mt-8">
                 
                 {/* QR Verification */}
                 <div className="text-left">
                    <div className="w-20 h-20 bg-white p-1 border border-zinc-200 mb-2">
                       <img 
                         src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${certId}`} 
                         alt="QR" 
                         className="w-full h-full object-contain" 
                       />
                    </div>
                    <p className="text-[9px] font-sans font-bold text-zinc-400 uppercase tracking-widest">ID: {certId}</p>
                 </div>

                 {/* Gold Seal */}
                 <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                       <div className="w-20 h-20 rounded-full border-2 border-yellow-800/30 flex items-center justify-center bg-yellow-500 text-yellow-900">
                          <CheckCircle className="w-10 h-10" />
                       </div>
                    </div>
                 </div>

                 {/* Signature */}
                 <div className="text-right">
                    <div className="w-48 border-b border-black mb-2 flex justify-center pb-1">
                        <img src="/signature.png" alt="Signature" className="h-10 opacity-80" onError={(e) => e.target.style.display = 'none'} /> 
                        {/* Fallback if no image */}
                        <span className="font-cursive text-2xl opacity-60" style={{fontFamily: 'cursive'}}>UniFlow Admin</span>
                    </div>
                    <p className="text-xs font-bold text-zinc-900 uppercase">Event Organizer</p>
                    <p className="text-[10px] text-zinc-400 font-sans uppercase">Chitkara University</p>
                 </div>

              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { X, Download, Share2, Award, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';

const CertificateModal = ({ isOpen, onClose, userName, eventTitle, eventDate, ticketId }) => {
  const certificateRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setDownloading(true);
    const element = certificateRef.current;

    try {
      // 1. Capture the certificate (High Scale for Crystal Clear Text)
      const canvas = await html2canvas(element, {
        scale: 2, // 2x Resolution
        backgroundColor: '#FFFCF5', // Match the paper color
        useCORS: true, // Fixes image cross-origin issues
        logging: false,
      });

      // 2. Convert to PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape, A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${userName.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (err) {
      console.error("Certificate Error:", err);
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      
      {/* Wrapper to handle mobile scrolling */}
      <div className="relative w-full max-w-5xl flex flex-col gap-4 max-h-[95vh]">
        
        {/* Action Bar (Top) */}
        <div className="flex justify-between items-center text-white px-2">
           <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Official Credential</h3>
           <button onClick={onClose} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors">
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* 📜 CERTIFICATE PREVIEW CONTAINER */}
        <div className="overflow-auto rounded-xl shadow-2xl border border-zinc-800 bg-zinc-900/50 p-4 flex justify-center">
          
          {/* THE ACTUAL CERTIFICATE NODE */}
          {/* We set a min-width to ensure it generates correctly even on small mobile screens */}
          <div 
            ref={certificateRef}
            className="relative bg-[#FFFCF5] text-black flex-shrink-0"
            style={{ width: '800px', height: '566px', padding: '40px' }} 
          >
            {/* 🎨 GOLD BORDER DESIGN */}
            <div className="absolute inset-0 border-[16px] border-double border-zinc-100 pointer-events-none"></div>
            <div className="absolute inset-4 border-2 border-[#D4AF37] opacity-50 pointer-events-none"></div>
            <div className="absolute inset-6 border border-[#D4AF37] opacity-30 pointer-events-none"></div>

            {/* Corner Ornaments */}
            <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-[#D4AF37]"></div>
            <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-[#D4AF37]"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-[#D4AF37]"></div>
            <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-[#D4AF37]"></div>

            {/* CONTENT LAYER */}
            <div className="relative z-10 h-full flex flex-col items-center justify-between py-8">
              
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-2">
                   <Award className="w-10 h-10 text-[#D4AF37]" />
                </div>
                <h2 className="text-xs font-black tracking-[0.4em] uppercase text-[#D4AF37]">Chitkara University</h2>
                <h1 className="text-5xl font-serif text-zinc-900 tracking-wide">
                  Certificate of Participation
                </h1>
              </div>

              {/* Name Section */}
              <div className="text-center w-3/4">
                <p className="text-zinc-500 italic font-serif mb-2">is hereby awarded to</p>
                <div className="py-2 border-b-2 border-[#D4AF37]/30">
                  <h3 className="text-4xl font-black uppercase tracking-tight text-zinc-900">
                    {userName || "Student Name"}
                  </h3>
                </div>
              </div>

              {/* Event Details */}
              <div className="text-center space-y-1">
                <p className="text-zinc-600 text-lg">For successfully attending and actively participating in</p>
                <h4 className="text-3xl font-bold text-indigo-900 uppercase">{eventTitle || "Event Name"}</h4>
                <p className="text-zinc-500">held on <span className="text-zinc-900 font-bold">{eventDate}</span></p>
              </div>

              {/* Footer / Digital Verification */}
              <div className="w-full flex justify-between items-end px-12 mt-4">
                 
                 {/* Left: Digital ID */}
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[#D4AF37]">
                       <ShieldCheck className="w-4 h-4" />
                       <span className="text-[9px] font-bold uppercase tracking-widest">Digitally Verified</span>
                    </div>
                    <p className="text-[8px] text-zinc-400">
                      ID: {ticketId ? ticketId.slice(0,8).toUpperCase() : 'UNKNOWN'}<br/>
                      Issued via UniFlow System.<br/>
                      No physical signature required.
                    </p>
                 </div>

                 {/* Center: Seal */}
                 <div className="absolute left-1/2 bottom-12 -translate-x-1/2 opacity-10">
                    <CheckCircle className="w-24 h-24" />
                 </div>

                 {/* Right: Powered By */}
                 <div className="text-right">
                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Powered By</p>
                    <div className="flex items-center gap-1 justify-end opacity-80">
                       <span className="text-lg font-black tracking-tighter text-black">
                         Uni<span className="text-indigo-600">Flow</span>
                       </span>
                    </div>
                 </div>

              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button 
             onClick={handleDownload} 
             disabled={downloading}
             className="w-full sm:w-auto px-8 py-4 bg-[#D4AF37] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-110 shadow-lg shadow-yellow-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {downloading ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
            {downloading ? "Generating PDF..." : "Download PDF"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CertificateModal;
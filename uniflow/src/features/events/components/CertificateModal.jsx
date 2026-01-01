import React, { useRef } from 'react';
import { X, Download, Share2, Award, ShieldCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CertificateModal = ({ isOpen, onClose, ticket }) => {
  const certificateRef = useRef(null);

  if (!isOpen || !ticket) return null;

  // 🛠️ DATA SAFEGUARDS (Fallbacks if data is missing)
  const studentName = ticket.userName || "Student Name";
  const eventName = ticket.eventTitle || "Event Name";
  const date = ticket.eventDate || new Date().toLocaleDateString();
  const certId = ticket.id ? ticket.id.slice(0, 8).toUpperCase() : "UNKNOWN";

  // 🖨️ DOWNLOAD FUNCTION
  const handleDownload = async () => {
    if (!certificateRef.current) return;
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificate_${eventName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Certificate generation failed", err);
      alert("Could not generate certificate.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="bg-zinc-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black/50">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Official Certificate
          </h3>
          <div className="flex gap-2">
            <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 📜 CERTIFICATE CANVAS (Visible) */}
        <div className="p-8 overflow-auto bg-zinc-800/50 flex justify-center">
          <div 
            ref={certificateRef}
            className="w-[800px] h-[560px] bg-white text-black relative flex flex-col items-center justify-between p-12 shadow-2xl border-[10px] border-double border-indigo-900 shrink-0"
            style={{ fontFamily: "'Times New Roman', serif" }}
          >
            {/* Watermark Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
               <ShieldCheck className="w-96 h-96 text-black" />
            </div>

            {/* Header */}
            <div className="text-center z-10 space-y-4">
               {/* 🟢 ACTION: Ensure logo.png exists in /public or remove this img tag */}
               <img src="/logo.png" alt="University Logo" className="h-16 mx-auto mb-2 opacity-80" onError={(e) => e.target.style.display = 'none'} />
               
               <h1 className="text-4xl font-bold uppercase tracking-widest text-indigo-900">Chitkara University</h1>
               <div className="w-32 h-1 bg-yellow-500 mx-auto mt-2"></div>
               <h2 className="text-5xl font-black mt-6 tracking-tight font-serif text-black">Certificate of Participation</h2>
            </div>

            {/* Body */}
            <div className="text-center z-10 space-y-6 mt-4">
               <p className="text-xl text-zinc-600 italic">is hereby awarded to</p>
               
               {/* 🎓 DYNAMIC NAME */}
               <h3 className="text-4xl font-bold text-indigo-700 border-b-2 border-zinc-300 pb-2 px-8 inline-block min-w-[300px]">
                 {studentName}
               </h3>

               <p className="text-lg text-zinc-600">
                 For successfully attending and actively participating in
               </p>

               {/* 📅 DYNAMIC EVENT */}
               <h4 className="text-2xl font-bold text-black uppercase tracking-wide">
                 {eventName}
               </h4>

               <p className="text-md text-zinc-500 font-bold">
                 held on {date}
               </p>
            </div>

            {/* Footer / Validation */}
            <div className="w-full flex justify-between items-end mt-12 z-10">
               <div className="text-left">
                  <div className="w-20 h-20 bg-white border-2 border-black p-1">
                     <img 
                       src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${certId}`} 
                       alt="Verification QR" 
                       className="w-full h-full object-contain"
                     />
                  </div>
                  <p className="text-[10px] font-bold mt-2 uppercase tracking-widest text-zinc-400">Digitally Verified</p>
                  <p className="text-[10px] font-mono text-zinc-500">ID: {certId}</p>
               </div>

               <div className="text-right">
                  {/* Signature Line */}
                  <div className="flex flex-col items-center">
                     <img src="/signature.png" alt="Sign" className="h-10 mb-[-10px] opacity-70" onError={(e) => e.target.style.display='none'} />
                     <div className="w-48 h-px bg-black mt-4"></div>
                     <p className="text-xs font-bold mt-1 text-zinc-600 uppercase">Event Organizer</p>
                     <p className="text-[9px] text-zinc-400 mt-0.5">Issued via UniFlow System</p>
                  </div>
               </div>
            </div>

            {/* Bottom Color Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-indigo-900"></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CertificateModal;
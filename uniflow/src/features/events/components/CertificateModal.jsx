import React, { useRef, useState } from 'react';
import { X, Download, Award, CheckCircle, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CertificateModal = ({ isOpen, onClose, ticket }) => {
  const certificateRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !ticket) return null;

  // 🛠️ DATA MAPPING
  const studentName = ticket.userName || ticket.name || "Student Name";
  const eventName = ticket.eventTitle || ticket.eventName || "Event Name";
  // Format Date nicely
  const dateObj = ticket.eventDate ? new Date(ticket.eventDate) : new Date();
  const date = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const certId = ticket.id ? ticket.id.slice(0, 12).toUpperCase() : "UNIFLOW-CERT";

  // 🖨️ DOWNLOAD FUNCTION (High Quality)
  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setDownloading(true);
    
    try {
      // Wait for images/fonts to render
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(certificateRef.current, {
        scale: 3, // High Resolution
        useCORS: true,
        backgroundColor: '#fffbf0',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); 
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
            Official Certificate
          </h3>
          <div className="flex gap-3">
            <button 
              onClick={handleDownload} 
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2 bg-yellow-600 hover:bg-yellow-500 text-black rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Download className="w-4 h-4" /> Download PDF</>}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 📜 PREVIEW AREA */}
        <div className="p-8 overflow-auto bg-zinc-900 flex justify-center items-center min-h-[400px]">
          
          {/* THE ACTUAL CERTIFICATE (A4 Landscape aspect ratio) */}
          <div 
            ref={certificateRef}
            style={{
                width: '842px',
                height: '595px',
                backgroundColor: '#fffbf0', // Ivory Cream
                color: '#1a1a1a',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '40px', // Adjusted padding to fit borders
                fontFamily: "'Times New Roman', serif",
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}
          >
            {/* --- DECORATIVE ELEMENTS --- */}

            {/* 1. Main Double Border */}
            <div style={{
                position: 'absolute',
                top: '15px', left: '15px', right: '15px', bottom: '15px',
                border: '3px double #B8860B', // Dark Goldenrod
                pointerEvents: 'none',
                zIndex: 20
            }}></div>

            {/* 2. Inner Fine Line */}
            <div style={{
                position: 'absolute',
                top: '22px', left: '22px', right: '22px', bottom: '22px',
                border: '1px solid #DAA520', 
                pointerEvents: 'none',
                zIndex: 20
            }}></div>

            {/* 3. Gold Sidebar (Left) */}
            <div style={{
                position: 'absolute', left: '0', top: '0', bottom: '0', width: '12px',
                background: 'linear-gradient(to bottom, #B8860B, #FFD700, #B8860B)',
                zIndex: 25
            }}></div>

            {/* 4. Corner Accents (Top-Right & Bottom-Left) */}
            <div style={{ position: 'absolute', top: '22px', right: '22px', width: '60px', height: '60px', borderTop: '4px solid #1e3a8a', borderRight: '4px solid #1e3a8a', zIndex: 21 }}></div>
            <div style={{ position: 'absolute', bottom: '22px', left: '22px', width: '60px', height: '60px', borderBottom: '4px solid #1e3a8a', borderLeft: '4px solid #1e3a8a', zIndex: 21 }}></div>

            {/* 5. Watermark */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                opacity: 0.04, zIndex: 0
            }}>
                <svg width="350" height="350" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L1 7l11 5 11-5-11-5zM1 7v10l11 5 11-5V7l-11 5L1 7z" />
                </svg>
            </div>

            {/* --- CONTENT LAYOUT --- */}
            <div style={{ zIndex: 30, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px 40px' }}>
                
                {/* HEADER */}
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <h1 style={{ 
                        fontSize: '32px', fontWeight: 'bold', textTransform: 'uppercase', 
                        color: '#1e3a8a', margin: '0', letterSpacing: '3px', fontFamily: 'sans-serif'
                    }}>
                        Chitkara University
                    </h1>
                    <div style={{ width: '80px', height: '2px', backgroundColor: '#DAA520', margin: '15px auto' }}></div>
                    <h2 style={{ fontSize: '42px', fontWeight: 'bold', margin: '0', color: '#111', fontFamily: 'serif' }}>
                        Certificate of Participation
                    </h2>
                    <p style={{ fontSize: '14px', letterSpacing: '1px', color: '#666', marginTop: '10px', textTransform: 'uppercase' }}>
                        This document is officially presented to
                    </p>
                </div>

                {/* BODY (NAME & EVENT) */}
                <div style={{ textAlign: 'center' }}>
                    
                    {/* STUDENT NAME */}
                    <h3 style={{ 
                        fontSize: '48px', 
                        fontWeight: 'normal', 
                        color: '#1e3a8a', 
                        margin: '10px 0 5px 0',
                        fontFamily: 'cursive', // Makes it look handwritten
                        borderBottom: '1px solid #ccc',
                        display: 'inline-block',
                        paddingBottom: '5px',
                        minWidth: '400px'
                    }}>
                        {studentName}
                    </h3>

                    <p style={{ fontSize: '16px', color: '#444', margin: '15px 0 5px 0', fontFamily: 'sans-serif' }}>
                        For active participation and successful completion of the event
                    </p>

                    {/* EVENT NAME */}
                    <h4 style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold', 
                        color: '#000', 
                        textTransform: 'uppercase', 
                        margin: '10px 0',
                        letterSpacing: '1px'
                    }}>
                        {eventName}
                    </h4>

                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#777', marginTop: '5px' }}>
                        HELD ON {date.toUpperCase()}
                    </p>
                </div>

                {/* FOOTER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
                     
                     {/* LEFT: QR Code */}
                     <div style={{ textAlign: 'center' }}>
                        <div style={{ border: '1px solid #ccc', padding: '4px', background: 'white', display: 'inline-block' }}>
                           <img 
                             src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${certId}`} 
                             alt="QR" 
                             style={{ width: '80px', height: '80px', display: 'block' }} 
                           />
                        </div>
                        <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#888', marginTop: '4px', fontFamily: 'sans-serif' }}>
                            ID: {certId}
                        </p>
                     </div>

                     {/* CENTER: Gold Seal */}
                     <div style={{ marginBottom: '10px' }}>
                        <div style={{ 
                            width: '80px', height: '80px', 
                            borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #FFD700, #B8860B)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                            border: '2px solid #fff'
                        }}>
                           <CheckCircle color="#5c3a00" size={40} />
                        </div>
                     </div>

                     {/* RIGHT: Signature */}
                     <div style={{ textAlign: 'center', minWidth: '150px' }}>
                        <div style={{ borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px' }}>
                            <img src="/signature.png" alt="Signature" style={{ height: '35px', opacity: 0.8, display: 'block', margin: '0 auto' }} onError={(e) => e.target.style.display='none'} />
                            <span style={{ fontFamily: 'cursive', fontSize: '20px', color: '#333' }}>UniFlow Admin</span>
                        </div>
                        <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>Event Organizer</p>
                        <p style={{ fontSize: '9px', color: '#666', margin: 0 }}>Chitkara University</p>
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
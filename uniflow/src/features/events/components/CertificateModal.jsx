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
  const date = ticket.eventDate ? new Date(ticket.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString();
  const certId = ticket.id ? ticket.id.slice(0, 12).toUpperCase() : "UNIFLOW-CERT";

  // 🖨️ DOWNLOAD FUNCTION (High Quality)
  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setDownloading(true);
    
    try {
      // Small delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(certificateRef.current, {
        scale: 3, // High Res
        useCORS: true,
        backgroundColor: '#fffbf0', // Cream Background explicitly set
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
          
          {/* THE ACTUAL CERTIFICATE (CSS-in-JS for Reliability) */}
          <div 
            ref={certificateRef}
            style={{
                width: '842px',
                height: '595px',
                backgroundColor: '#fffbf0',
                color: '#1a1a1a',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '60px',
                fontFamily: "'Times New Roman', serif",
                boxSizing: 'border-box'
            }}
          >
            {/* 🎨 GOLD BORDER FRAME */}
            <div style={{
                position: 'absolute',
                top: '20px', left: '20px', right: '20px', bottom: '20px',
                border: '4px double #DAA520', // Goldenrod
                pointerEvents: 'none',
                zIndex: 20
            }}></div>

            {/* CORNER DECORATIONS (CSS Shapes) */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', width: '80px', height: '80px', borderTop: '4px solid #B8860B', borderLeft: '4px solid #B8860B', zIndex: 21 }}></div>
            <div style={{ position: 'absolute', top: '20px', right: '20px', width: '80px', height: '80px', borderTop: '4px solid #B8860B', borderRight: '4px solid #B8860B', zIndex: 21 }}></div>
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', width: '80px', height: '80px', borderBottom: '4px solid #B8860B', borderLeft: '4px solid #B8860B', zIndex: 21 }}></div>
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '80px', height: '80px', borderBottom: '4px solid #B8860B', borderRight: '4px solid #B8860B', zIndex: 21 }}></div>

            {/* WATERMARK BACKGROUND (Low Opacity) */}
            <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.05,
                pointerEvents: 'none',
                zIndex: 0
            }}>
                {/* SVG Shield Icon manually for SVG support */}
                <svg width="400" height="400" viewBox="0 0 24 24" fill="currentColor" color="black">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            </div>

            {/* CONTENT */}
            <div style={{ zIndex: 10, width: '100%', textAlign: 'center' }}>
                
                {/* Header */}
                <div style={{ marginBottom: '20px' }}>
                    <h1 style={{ 
                        fontSize: '36px', 
                        fontWeight: 'bold', 
                        textTransform: 'uppercase', 
                        color: '#1e3a8a', // Dark Blue
                        margin: 0,
                        letterSpacing: '2px'
                    }}>
                        Chitkara University
                    </h1>
                    <div style={{ width: '100px', height: '3px', backgroundColor: '#DAA520', margin: '15px auto' }}></div>
                    <h2 style={{ fontSize: '48px', fontWeight: 'bold', margin: '10px 0', color: '#000' }}>Certificate of Participation</h2>
                </div>

                {/* Body */}
                <div style={{ marginTop: '30px' }}>
                    <p style={{ fontSize: '18px', fontStyle: 'italic', color: '#555' }}>is hereby awarded to</p>
                    
                    <h3 style={{ 
                        fontSize: '42px', 
                        fontWeight: 'bold', 
                        color: '#1e3a8a', 
                        margin: '20px 0',
                        fontFamily: 'cursive', // Falls back nicely
                        borderBottom: '2px solid #ddd',
                        display: 'inline-block',
                        paddingBottom: '10px',
                        minWidth: '400px'
                    }}>
                        {studentName}
                    </h3>

                    <p style={{ fontSize: '18px', color: '#555', margin: '10px 0' }}>
                        For successfully attending and actively participating in
                    </p>

                    <h4 style={{ fontSize: '28px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase', margin: '15px 0' }}>
                        {eventName}
                    </h4>

                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#666' }}>
                        Held on {date}
                    </p>
                </div>
            </div>

            {/* FOOTER */}
            <div style={{ 
                zIndex: 10, 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-end',
                marginTop: '40px',
                padding: '0 40px'
            }}>
                 
                 {/* Validation */}
                 <div style={{ textAlign: 'left' }}>
                    <div style={{ 
                        width: '80px', height: '80px', 
                        border: '2px solid #000', 
                        padding: '4px',
                        backgroundColor: 'white'
                    }}>
                       <img 
                         src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${certId}`} 
                         alt="QR" 
                         style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                       />
                    </div>
                    <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '5px', color: '#666' }}>Digitally Verified</p>
                    <p style={{ fontSize: '10px', fontFamily: 'monospace', color: '#888' }}>ID: {certId}</p>
                 </div>

                 {/* Gold Seal (CSS) */}
                 <div style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)' }}>
                    <div style={{ 
                        width: '90px', height: '90px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #FFD700, #B8860B)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                    }}>
                       <CheckCircle color="#704214" size={40} />
                    </div>
                 </div>

                 {/* Signature */}
                 <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '180px', borderBottom: '2px solid #000', marginBottom: '8px', paddingBottom: '5px' }}>
                        {/* Fake Signature Font */}
                        <span style={{ fontFamily: 'cursive', fontSize: '24px', opacity: 0.7 }}>UniFlow Admin</span>
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Event Organizer</p>
                 </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
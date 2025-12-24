import { useRef } from 'react';
import { X, Download, ShieldCheck } from 'lucide-react';
import html2canvas from 'html2canvas';

const CertificateModal = ({ ticket, onClose }) => {
  const certificateRef = useRef(null);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    try {
      const canvas = await html2canvas(certificateRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Certificate_${ticket.userName.replace(/\s+/g, '_')}.png`;
      link.click();
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  // Verification URL
  const verifyUrl = `${window.location.origin}/verify?id=${ticket.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-700">
           <h2 className="font-bold text-zinc-700 dark:text-white flex items-center gap-2">
             <ShieldCheck className="h-5 w-5 text-emerald-500" />
             Official Certificate
           </h2>
           <div className="flex gap-2">
             <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors">
               <Download className="h-4 w-4" /> Download
             </button>
             <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-500">
               <X className="h-5 w-5" />
             </button>
           </div>
        </div>

        {/* CERTIFICATE CANVAS (Visuals) */}
        <div className="flex-1 bg-zinc-200 dark:bg-zinc-950 p-4 md:p-8 overflow-auto flex justify-center">
           <div 
             ref={certificateRef}
             className="w-[800px] h-[566px] bg-white text-zinc-900 relative shadow-2xl flex-shrink-0"
             style={{ 
               backgroundImage: 'radial-gradient(circle at 50% 50%, #fafafa 0%, #f4f4f5 100%)',
               border: '10px solid #4f46e5' 
             }}
           >
              {/* Decorative Corner */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-600" style={{clipPath: 'polygon(0 0, 100% 0, 0 100%)'}}></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-600" style={{clipPath: 'polygon(100% 100%, 0 100%, 100% 0)'}}></div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                 
                 {/* Logo */}
                 <div className="mb-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-3xl font-black shadow-lg mx-auto mb-2">U</div>
                    <p className="text-xs tracking-[0.3em] font-bold text-zinc-400 uppercase">UniFlow Events</p>
                 </div>

                 <h1 className="text-5xl font-serif font-bold text-zinc-900 mb-4 tracking-wide">CERTIFICATE</h1>
                 <p className="text-zinc-500 text-lg uppercase tracking-widest mb-8">Of Participation</p>

                 <p className="text-zinc-600 text-lg">This is to certify that</p>
                 <h2 className="text-4xl font-bold text-indigo-600 my-4 font-serif italic border-b-2 border-indigo-100 pb-2 px-8 min-w-[400px]">
                   {ticket.userName}
                 </h2>

                 <p className="text-zinc-600 text-lg max-w-lg leading-relaxed mt-2">
                   has successfully attended and participated in <br/>
                   <span className="font-bold text-zinc-900">{ticket.eventTitle}</span>
                 </p>
                 
                 <p className="text-zinc-500 mt-2 text-sm">
                   held on {new Date(ticket.eventDate).toLocaleDateString()}
                 </p>

                 {/* Footer ID & Link */}
                 <div className="absolute bottom-8 left-0 right-0 px-12 flex justify-between items-end text-left">
                    <div>
                       <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Certificate ID</p>
                       <p className="font-mono text-xs font-bold text-zinc-600">{ticket.id}</p>
                    </div>
                    
                    <div className="text-right">
                       <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Verify at</p>
                       <p className="font-mono text-xs font-bold text-indigo-600">{verifyUrl}</p>
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
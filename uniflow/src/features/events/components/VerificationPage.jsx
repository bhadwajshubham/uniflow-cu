import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ShieldCheck, XCircle, Search, Loader2, CheckCircle } from 'lucide-react';

const VerificationPage = () => {
  const [searchParams] = useSearchParams();
  const urlId = searchParams.get('id'); // ?id=XYZ
  
  const [ticketId, setTicketId] = useState(urlId || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-verify if ID is in URL
  useEffect(() => {
    if (urlId) verifyTicket(urlId);
  }, [urlId]);

  const verifyTicket = async (idToVerify) => {
    if (!idToVerify.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const docRef = doc(db, 'registrations', idToVerify.trim());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'attended') {
          setResult({ valid: true, data });
        } else {
          setResult({ 
            valid: false, 
            reason: data.status === 'cancelled' ? 'Ticket Cancelled' : 'Did Not Attend Event' 
          });
        }
      } else {
        setResult({ valid: false, reason: 'Invalid Certificate ID' });
      }
    } catch (error) {
      console.error(error);
      setResult({ valid: false, reason: 'System Error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    verifyTicket(ticketId);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-600 p-8 text-center">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Credential Verification</h1>
          <p className="text-indigo-100 text-sm mt-1">UniFlow Official Records</p>
        </div>

        {/* Search Box */}
        <div className="p-8">
          <form onSubmit={handleSearch} className="relative mb-8">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Enter Certificate ID"
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase font-mono tracking-widest text-center dark:text-white"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
            />
          </form>

          {/* Result Area */}
          {loading ? (
             <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
          ) : result ? (
             <div className={`text-center p-6 rounded-xl border-2 animate-in zoom-in duration-300 ${result.valid ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900' : 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900'}`}>
                {result.valid ? (
                  <>
                    <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Verified Authentic</h3>
                    <div className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400 text-left bg-white/50 dark:bg-black/20 p-4 rounded-lg">
                      <p><span className="font-bold text-zinc-900 dark:text-white">Student:</span> {result.data.userName}</p>
                      <p><span className="font-bold text-zinc-900 dark:text-white">Event:</span> {result.data.eventTitle}</p>
                      <p><span className="font-bold text-zinc-900 dark:text-white">Date:</span> {new Date(result.data.eventDate).toLocaleDateString()}</p>
                      <p><span className="font-bold text-zinc-900 dark:text-white">ID:</span> <span className="font-mono">{ticketId}</span></p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-red-700 dark:text-red-400">Verification Failed</h3>
                    <p className="text-zinc-500 mt-2">{result.reason}</p>
                  </>
                )}
             </div>
          ) : (
            <div className="text-center text-zinc-400 text-sm">
              Enter the ID found at the bottom of the certificate.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-black text-center text-xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
          SECURE VERIFICATION SYSTEM • UNIFLOW
        </div>

      </div>
    </div>
  );
};

export default VerificationPage;
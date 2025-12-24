import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, XCircle, Loader2, ScanLine, Users, ArrowRight } from 'lucide-react';

const ScannerPage = () => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanner, setScanner] = useState(null);
  const [manualCode, setManualCode] = useState('');

  // LIVE HUD STATS
  const [currentEventTitle, setCurrentEventTitle] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({ sold: 0, attended: 0 });

  useEffect(() => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    setScanner(html5QrcodeScanner);

    return () => {
      html5QrcodeScanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, []);

  // --- HELPER: UPDATE HUD STATS ---
  const updateStats = async (eventId) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (eventSnap.exists()) {
        const data = eventSnap.data();
        setCurrentEventTitle(data.title);
        
        // Note: 'totalTickets' is capacity. 'ticketsSold' is registrations.
        // We need 'attendedCount' ideally. Since we don't store a separate counter on the event doc for 'attended'
        // (we calculate it in dashboard), we will just show "Total Registrations" vs "Capacity" for now,
        // OR we can query the registrations collection if we want perfect accuracy. 
        // For speed in the scanner, let's show Tickets Sold vs Capacity first.
        
        setAttendanceStats({
          sold: data.ticketsSold || 0,
          total: data.totalTickets || 100
        });
      }
    } catch (e) {
      console.error("Stats update failed", e);
    }
  };

  const processTicket = async (ticketId) => {
    setLoading(true);
    setScanResult(null);

    try {
      const ticketRef = doc(db, 'registrations', ticketId);
      
      const result = await runTransaction(db, async (transaction) => {
        const ticketDoc = await transaction.get(ticketRef);
        if (!ticketDoc.exists()) throw new Error("Invalid Ticket ID");

        const data = ticketDoc.data();
        
        // 1. Check Status
        if (data.status === 'attended') {
            // Even if already attended, fetch stats so the volunteer sees which event this is
            return { status: 'already_scanned', data };
        }
        if (data.status === 'cancelled') throw new Error("Ticket is Cancelled");

        // 2. Mark as Attended
        transaction.update(ticketRef, { 
            status: 'attended',
            checkInTime: serverTimestamp() 
        });

        return { status: 'success', data };
      });

      // Update UI Result
      setScanResult({
        type: result.status === 'success' ? 'success' : 'warning',
        message: result.status === 'success' ? 'Access Granted' : 'Already Scanned',
        student: result.data.userName,
        event: result.data.eventTitle,
        typeLabel: result.data.type
      });

      // Update HUD
      updateStats(result.data.eventId);

    } catch (error) {
      setScanResult({
        type: 'error',
        message: error.message || "Scan Failed"
      });
    } finally {
      setLoading(false);
    }
  };

  const onScanSuccess = (decodedText, decodedResult) => {
    // Prevent multiple scans of the same code in rapid succession
    if (loading) return;
    processTicket(decodedText);
  };

  const onScanFailure = (error) => {
    // console.warn(error); // Ignore frame errors
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode) processTicket(manualCode);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans flex flex-col">
      
      {/* 1. HUD (Heads Up Display) */}
      {currentEventTitle && (
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-4 animate-in slide-in-from-top">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-indigo-400 truncate pr-4">{currentEventTitle}</h3>
            <div className="flex items-center gap-2 text-xs font-bold bg-indigo-900/30 px-2 py-1 rounded text-indigo-300">
               <Users className="h-3 w-3" /> Live
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
             <span>Registrations</span>
             <span>{attendanceStats.sold} / {attendanceStats.total}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
             <div 
               className="h-full bg-indigo-500 transition-all duration-500" 
               style={{ width: `${Math.min((attendanceStats.sold / attendanceStats.total) * 100, 100)}%` }}
             ></div>
          </div>
        </div>
      )}

      {/* 2. SCANNER CAMERA */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div id="reader" className="w-full max-w-sm bg-zinc-900 rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-2xl"></div>
        <p className="text-zinc-500 text-xs mt-4">Point camera at QR Code</p>
      </div>

      {/* 3. RESULT CARD (Overlay) */}
      {loading && (
         <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
           <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
         </div>
      )}

      {scanResult && !loading && (
        <div className={`fixed bottom-0 left-0 right-0 p-6 rounded-t-3xl shadow-2xl z-40 transform transition-transform duration-300 ${
          scanResult.type === 'success' ? 'bg-emerald-600' : 
          scanResult.type === 'warning' ? 'bg-amber-600' : 'bg-red-600'
        }`}>
          <div className="flex items-start gap-4 text-white">
             {scanResult.type === 'success' ? <CheckCircle className="h-10 w-10 shrink-0" /> : 
              scanResult.type === 'warning' ? <ScanLine className="h-10 w-10 shrink-0" /> :
              <XCircle className="h-10 w-10 shrink-0" />}
             
             <div>
               <h2 className="text-2xl font-black uppercase tracking-wide">{scanResult.message}</h2>
               {scanResult.student && (
                 <div className="mt-2 text-white/90">
                   <p className="text-lg font-bold">{scanResult.student}</p>
                   <p className="text-sm opacity-75">{scanResult.event}</p>
                   <span className="inline-block mt-2 px-2 py-1 bg-black/20 rounded text-xs font-bold uppercase">
                     {scanResult.typeLabel}
                   </span>
                 </div>
               )}
             </div>
          </div>

          <button 
            onClick={() => setScanResult(null)}
            className="mt-6 w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            Scan Next <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 4. MANUAL ENTRY */}
      {!scanResult && (
        <form onSubmit={handleManualSubmit} className="mt-6">
          <div className="relative">
            <ScanLine className="absolute left-4 top-3.5 h-5 w-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Enter Ticket ID manually"
              className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
          </div>
        </form>
      )}
    </div>
  );
};

export default ScannerPage;
import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, Zap } from 'lucide-react'; // Added Zap icon

const ScannerPage = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null); 
  const [message, setMessage] = useState('');
  
  // Refs for High-Speed State Management
  const isProcessing = useRef(false);
  const lastScannedId = useRef(null);
  const timerRef = useRef(null); 

  useEffect(() => {
    // ⚡ TURBO CONFIGURATION
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 30, // 🚀 Checks 30 times per second (was 10)
        qrbox: { width: 280, height: 280 }, // Slightly larger scan area
        aspectRatio: 1.0,
        disableFlip: false,
      },
      false
    );

    scanner.render(onScanSuccess, (error) => {});

    async function onScanSuccess(decodedText) {
      // 🔒 Debounce Logic
      if (isProcessing.current) return; 
      if (decodedText === lastScannedId.current) return; 

      isProcessing.current = true;
      lastScannedId.current = decodedText;
      
      // Kill previous timers immediately
      if (timerRef.current) clearTimeout(timerRef.current);

      // 🎵 Fast Beep
      new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(()=>{});

      try {
        const ticketRef = doc(db, 'registrations', decodedText);
        const ticketSnap = await getDoc(ticketRef);

        if (!ticketSnap.exists()) {
          setScanResult('error');
          setMessage('Invalid ID');
          // ⚡ Super Fast Reset for Errors (1s)
          timerRef.current = setTimeout(() => { isProcessing.current = false; }, 1000);
          return;
        }

        const data = ticketSnap.data();

        if (data.status === 'attended' || data.status === 'used') {
          setScanResult('warning');
          setMessage(`USED: ${data.userName}`);
        } else if (data.status === 'cancelled') {
          setScanResult('error');
          setMessage('CANCELLED');
        } else {
          // ✅ Success!
          // We fire the update but don't wait for it to finish UI update to make it feel instant
          updateDoc(ticketRef, {
            status: 'attended',
            scannedAt: serverTimestamp()
          });
          setScanResult('success');
          setMessage(`WELCOME: ${data.userName}`);
        }

      } catch (err) {
        setScanResult('error');
        setMessage('Error');
      } finally {
        // ⚡ TURBO RESET: Ready for next person in 1.5 seconds
        timerRef.current = setTimeout(() => {
          isProcessing.current = false;
          setScanResult(null);
          setMessage('');
          // Clear last scanned ID so we can scan the same person again if needed after delay
          lastScannedId.current = null; 
        }, 1500);
      }
    }

    return () => {
      scanner.clear().catch(console.error);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      <div className="w-full p-4 flex items-center justify-between bg-zinc-900 border-b border-zinc-800">
        <button onClick={() => navigate('/admin')} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-lg flex items-center gap-2">
           Gate Scanner <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-[10px] rounded uppercase border border-yellow-500/30 flex items-center gap-1"><Zap className="w-3 h-3" /> Turbo</span>
        </h1>
        <div className="w-9"></div> 
      </div>

      <div className="w-full max-w-md p-4 flex-1 flex flex-col justify-center">
        <div id="reader" className="w-full rounded-2xl overflow-hidden border-2 border-zinc-700 bg-black shadow-2xl"></div>
        <p className="text-center text-zinc-500 text-sm mt-4 animate-pulse">Ready to scan...</p>
      </div>

      {scanResult && (
        <div className={`fixed bottom-0 left-0 right-0 p-8 rounded-t-3xl shadow-2xl transition-transform duration-200 transform translate-y-0 ${
          scanResult === 'success' ? 'bg-green-600' : 
          scanResult === 'warning' ? 'bg-amber-500' : 'bg-red-600'
        }`}>
          <div className="flex flex-col items-center text-center text-white">
            {scanResult === 'success' && <CheckCircle className="w-20 h-20 mb-2 animate-in zoom-in duration-200" />}
            {scanResult === 'warning' && <AlertCircle className="w-20 h-20 mb-2 animate-in zoom-in duration-200" />}
            {scanResult === 'error' && <XCircle className="w-20 h-20 mb-2 animate-in zoom-in duration-200" />}
            
            <h2 className="text-3xl font-black uppercase tracking-wide leading-none">
              {scanResult === 'success' ? 'GO AHEAD' : scanResult === 'warning' ? 'STOP' : 'DENIED'}
            </h2>
            <p className="font-bold mt-2 text-xl truncate max-w-xs">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerPage;
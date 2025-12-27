import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const ScannerPage = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null); // 'success' | 'error' | 'warning'
  const [message, setMessage] = useState('');
  const [lastScannedId, setLastScannedId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Prevent scanner from initializing twice
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);

    function onScanFailure(error) {
      // Handle scan failure, usually better to ignore to prevent console spam
    }

    async function onScanSuccess(decodedText, decodedResult) {
      if (isProcessing) return; // Prevent double taps
      if (decodedText === lastScannedId) return; // Debounce same code

      setIsProcessing(true);
      setLastScannedId(decodedText);
      
      // Play Beep
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.play().catch(e => console.log("Audio play failed", e));

      try {
        // 1. Check if Ticket Exists
        const ticketRef = doc(db, 'registrations', decodedText);
        const ticketSnap = await getDoc(ticketRef);

        if (!ticketSnap.exists()) {
          setScanResult('error');
          setMessage('Invalid Ticket: ID not found in database.');
          setIsProcessing(false);
          return;
        }

        const data = ticketSnap.data();

        // 2. Check Status
        if (data.status === 'attended' || data.status === 'used') {
          setScanResult('warning');
          setMessage(`⚠️ ALREADY USED by ${data.userName}`);
        } else if (data.status === 'cancelled') {
          setScanResult('error');
          setMessage('❌ Ticket Cancelled.');
        } else {
          // 3. Mark as Attended
          await updateDoc(ticketRef, {
            status: 'attended', // Consistent status
            scannedAt: serverTimestamp()
          });
          setScanResult('success');
          setMessage(`✅ Verified: ${data.userName}`);
        }

      } catch (err) {
        console.error("Scan Error", err);
        setScanResult('error');
        setMessage('System Error: Could not verify.');
      } finally {
        // Allow next scan after 3 seconds
        setTimeout(() => {
          setIsProcessing(false);
          setScanResult(null);
          setMessage('');
        }, 3000);
      }
    }

    // Cleanup logic
    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [lastScannedId, isProcessing]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full p-4 flex items-center justify-between bg-zinc-900 border-b border-zinc-800">
        <button onClick={() => navigate('/admin')} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-lg">Ticket Scanner</h1>
        <div className="w-9"></div> {/* Spacer */}
      </div>

      {/* Scanner Viewport */}
      <div className="w-full max-w-md p-4 flex-1 flex flex-col justify-center">
        <div id="reader" className="w-full rounded-2xl overflow-hidden border-2 border-zinc-700 bg-black"></div>
        
        <p className="text-center text-zinc-500 text-sm mt-4">
          Point camera at the Student's QR Code
        </p>
      </div>

      {/* Result Overlay */}
      {scanResult && (
        <div className={`fixed bottom-0 left-0 right-0 p-8 rounded-t-3xl shadow-2xl transition-transform duration-300 transform translate-y-0 ${
          scanResult === 'success' ? 'bg-green-600' : 
          scanResult === 'warning' ? 'bg-amber-500' : 'bg-red-600'
        }`}>
          <div className="flex flex-col items-center text-center text-white">
            {scanResult === 'success' && <CheckCircle className="w-16 h-16 mb-2" />}
            {scanResult === 'warning' && <AlertCircle className="w-16 h-16 mb-2" />}
            {scanResult === 'error' && <XCircle className="w-16 h-16 mb-2" />}
            
            <h2 className="text-2xl font-black uppercase tracking-wide">
              {scanResult === 'success' ? 'APPROVED' : scanResult === 'warning' ? 'WARNING' : 'DENIED'}
            </h2>
            <p className="font-medium mt-1 text-lg">{message}</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default ScannerPage;
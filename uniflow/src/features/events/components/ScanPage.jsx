import React, { useState, useEffect, useRef } from 'react';
import { QrCode, X, Search, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const ScanPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState(null); // 'success', 'error', null
  const [resultMessage, setResultMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Start Camera on Mount
  useEffect(() => {
    startCamera();
    return () => stopCamera(); // Cleanup on unmount
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      // Request Back Camera (environment)
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setError("Could not access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // 2. Validate Ticket Logic
  const handleValidate = async (ticketId) => {
    if (!ticketId) return;
    setLoading(true);
    setScanResult(null);

    try {
      // Check if ticket exists in Firestore
      const docRef = doc(db, 'registrations', ticketId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Invalid Ticket ID. Not found.");
      }

      const data = docSnap.data();

      // Check if already used
      if (data.status === 'used') {
        setScanResult('error');
        setResultMessage(`⚠️ Ticket already used by ${data.userName || 'Student'}!`);
      } else if (data.status === 'cancelled') {
         setScanResult('error');
         setResultMessage(`❌ Ticket was cancelled.`);
      } else {
        // MARK AS USED
        await updateDoc(docRef, { 
          status: 'used',
          scannedAt: new Date()
        });
        setScanResult('success');
        setResultMessage(`✅ Verified! Welcome, ${data.userName || 'Student'}.`);
      }

    } catch (err) {
      setScanResult('error');
      setResultMessage(err.message);
    } finally {
      setLoading(false);
      setManualCode('');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <QrCode className="w-5 h-5 text-indigo-400" /> Scanner
        </h1>
        <button 
          onClick={() => navigate('/admin')}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-zinc-900">
        {error ? (
          <div className="text-center p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-zinc-400">{error}</p>
            <button onClick={startCamera} className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg">Retry</button>
          </div>
        ) : (
          <>
            {/* Live Video */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            
            {/* Scanning Frame Overlay */}
            <div className="relative w-64 h-64 border-2 border-white/50 rounded-3xl z-10 flex flex-col items-center justify-center">
               <div className="w-60 h-0.5 bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-scan absolute"></div>
               <p className="mt-72 text-sm font-medium text-white/80 bg-black/50 px-3 py-1 rounded-full backdrop-blur">
                 Align QR Code within frame
               </p>
            </div>
          </>
        )}

        {/* Success/Error Popup Overlay */}
        {scanResult && (
          <div className={`absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in`}>
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-sm text-center mx-4 border border-zinc-700">
              {scanResult === 'success' ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : (
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              )}
              <h3 className="text-xl font-bold text-white mb-2">
                {scanResult === 'success' ? 'Access Granted' : 'Access Denied'}
              </h3>
              <p className="text-zinc-400 mb-6">{resultMessage}</p>
              <button 
                onClick={() => setScanResult(null)}
                className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl font-bold transition-colors"
              >
                Scan Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry Footer */}
      <div className="bg-zinc-900 p-6 rounded-t-3xl border-t border-zinc-800">
        <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Manual Entry</p>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Enter Ticket ID..." 
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
          />
          <button 
            onClick={() => handleValidate(manualCode)}
            disabled={loading || !manualCode}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl font-bold disabled:opacity-50"
          >
            {loading ? '...' : <CheckCircle className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanPage;
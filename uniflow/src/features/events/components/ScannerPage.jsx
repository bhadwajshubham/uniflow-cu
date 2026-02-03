import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, ShieldAlert, Zap } from 'lucide-react';

const ScannerPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [scanResult, setScanResult] = useState(null); 
  const [message, setMessage] = useState('');
  
  // Refs
  const scannerRef = useRef(null);
  const isProcessing = useRef(false);
  const lastScannedId = useRef(null);

  // ✅ Allowed Roles Helper
  const allowedRoles = ['admin', 'super_admin', 'scanner'];
  const canAccess = profile && allowedRoles.includes(profile.role);

  // 🔊 AUDIO & VOICE ENGINE
  const playFeedback = (type, name = "") => {
    // 1. Vibration (Haptic Feedback)
    if (navigator.vibrate) {
        if (type === 'success') navigator.vibrate(200); // Short buzz
        else navigator.vibrate([100, 50, 100]); // Double buzz for error
    }

    // 2. Audio Beep
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'success') {
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
        oscillator.type = 'sine';
      } else {
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); 
        oscillator.type = 'square';
      }
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) { console.error("Audio error:", e); }

    // 3. Voice (Text-to-Speech)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      let text = type === 'success' ? `Welcome, ${name}` : 
                 type === 'error' ? 'Invalid Ticket' : 
                 type === 'warning' ? 'Already Used' : 'Unauthorized';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2; // Thoda tez bolega
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (!canAccess) return;

    if (!scannerRef.current) {
        const scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            showTorchButtonIfSupported: true,
            rememberLastUsedCamera: true
          },
          false 
        );
    
        scannerRef.current = scanner;
    
        const onScanSuccess = async (decodedText) => {
          // Double Scan Prevention Logic
          if (isProcessing.current || decodedText === lastScannedId.current) return;
          
          isProcessing.current = true;
          lastScannedId.current = decodedText;
          setScanResult('processing');
          setMessage('Verifying...');

          let delayTime = 2000; // Default Fallback

          try {
            const ticketRef = doc(db, 'tickets', decodedText);
            const ticketSnap = await getDoc(ticketRef);
    
            if (!ticketSnap.exists()) {
              // 🔴 INVALID TICKET
              setScanResult('error');
              setMessage('Invalid Ticket');
              playFeedback('error');
              delayTime = 3000; // 3 Seconds (Guard needs to see this)
            } else {
              const data = ticketSnap.data();
    
              if (data.scanned === true) {
                // ⚠️ ALREADY USED
                setScanResult('warning');
                setMessage(`Used by: ${data.userName}`);
                playFeedback('warning');
                delayTime = 3000; // 3 Seconds (Alert)
              } else {
                // ✅ SUCCESS
                await updateDoc(ticketRef, {
                  scanned: true,
                  scannedAt: serverTimestamp()
                });
                setScanResult('success');
                setMessage(data.userName || 'Student');
                playFeedback('success', data.userName?.split(' ')[0]);
                
                // ⚡ SPEED LOGIC: 1.5s is safest minimum to avoid double-scan errors
                delayTime = 1500; 
              }
            }
          } catch (err) {
            console.error(err);
            setScanResult('error');
            setMessage('Scan Error');
            playFeedback('error');
            delayTime = 2500;
          } finally {
            setTimeout(() => {
              isProcessing.current = false;
              lastScannedId.current = null; // Reset taaki naya banda scan ho sake
              setScanResult(null);
              setMessage('');
            }, delayTime); 
          }
        };
    
        scanner.render(onScanSuccess, (err) => { /* ignore scanning errors */ });
    }

    return () => {
        if (scannerRef.current) {
            try {
                scannerRef.current.clear();
            } catch (e) { console.error("Scanner clear error", e); }
            scannerRef.current = null;
        }
    };
  }, [profile, user, canAccess]);

  // Block Unauthorized Access
  if (!canAccess) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-red-500">
        <ShieldAlert className="w-20 h-20 mb-4 animate-pulse" />
        <h1 className="text-2xl font-black uppercase">Restricted</h1>
        <p className="text-zinc-500 mt-2">You don't have permission to scan tickets.</p>
        <button onClick={() => navigate('/')} className="mt-8 px-6 py-3 bg-zinc-800 text-white rounded-xl font-bold">Home</button>
      </div>
    );
  }

  // Handle Exit Button
  const handleExit = () => {
    if (profile?.role === 'scanner') {
        navigate('/');
    } else {
        navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-6">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
            <button onClick={handleExit} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase">
              <ArrowLeft className="w-5 h-5" /> Exit
            </button>
            <div className="flex items-center gap-2 text-indigo-400">
                <Zap className="w-4 h-4 fill-current animate-pulse" />
                <span className="text-[10px] font-black uppercase">Live Scanner</span>
            </div>
        </div>

        <div className="bg-zinc-900 rounded-[2rem] p-4 border border-zinc-800 shadow-2xl overflow-hidden relative">
          {/* SCANNER CONTAINER */}
          <div id="reader" className="overflow-hidden rounded-xl bg-black"></div>
          
          {/* OVERLAY FEEDBACK */}
          {scanResult && (
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md animate-in fade-in duration-200 ${
              scanResult === 'success' ? 'bg-green-500/80' : 
              scanResult === 'warning' ? 'bg-amber-500/80' : 
              scanResult === 'processing' ? 'bg-indigo-600/80' : 'bg-red-600/80'
            }`}>
              {scanResult === 'success' && <CheckCircle className="w-20 h-20 mb-4 text-white drop-shadow-lg" />}
              {scanResult === 'error' && <XCircle className="w-20 h-20 mb-4 text-white drop-shadow-lg" />}
              {scanResult === 'warning' && <AlertCircle className="w-20 h-20 mb-4 text-white drop-shadow-lg" />}
              
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white drop-shadow-md">
                {scanResult === 'processing' ? 'Checking...' : scanResult}
              </h2>
              <p className="mt-2 font-bold text-white text-lg drop-shadow-md">{message}</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">
                Point camera at QR Code
            </p>
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;
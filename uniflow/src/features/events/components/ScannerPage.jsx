import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, ShieldAlert, Zap } from 'lucide-react';

const ScannerPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [scanResult, setScanResult] = useState(null); 
  const [message, setMessage] = useState('');
  const lastScannedId = useRef(null);
  const isProcessing = useRef(false);

  // 🔊 AUDIO & VOICE ENGINE
  const playFeedback = (type, name = "") => {
    // 1. Digital Beep
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'success') {
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch
      oscillator.type = 'sine';
    } else {
      oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // Low pitch/Buzz
      oscillator.type = 'square';
    }

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
    oscillator.stop(audioCtx.currentTime + 0.1);

    // 2. Pro Voice Welcome (Text-to-Speech)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any current speaking
      let text = "";
      if (type === 'success') text = `Welcome, ${name}`;
      if (type === 'error') text = `Invalid Ticket`;
      if (type === 'warning') text = `Already Scanned`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1; // Slightly faster for gate speed
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return;
    }

    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 15, // ⚡ Turbo FPS
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] // Speed hack: QR only
      }
    );

    const onScanSuccess = async (decodedText) => {
      if (isProcessing.current || decodedText === lastScannedId.current) return;
      
      isProcessing.current = true;
      lastScannedId.current = decodedText;
      setScanResult('processing');

      try {
        const regRef = doc(db, 'registrations', decodedText);
        const regSnap = await getDoc(regRef);

        if (!regSnap.exists()) {
          setScanResult('error');
          setMessage('Invalid Ticket: Not found in database.');
          playFeedback('error');
        } else {
          const data = regSnap.data();
          // Support both 'attended' and your current 'checkedIn' status
          if (data.status === 'attended' || data.checkedIn === true) {
            setScanResult('warning');
            setMessage(`Already Used: Scanned at ${data.attendedAt?.toDate().toLocaleTimeString()}`);
            playFeedback('warning');
          } else {
            await updateDoc(regRef, {
              status: 'attended',
              checkedIn: true,
              attendedAt: serverTimestamp()
            });
            setScanResult('success');
            setMessage(`Access Granted: Welcome, ${data.userName}!`);
            playFeedback('success', data.userName);
          }
        }
      } catch (err) {
        setScanResult('error');
        setMessage('Network Error: Could not verify.');
        playFeedback('error');
      } finally {
        // ⚡ TURBO RESET: Reduced to 800ms for high-speed gate entry
        setTimeout(() => {
          isProcessing.current = false;
          lastScannedId.current = null;
          setScanResult(null);
        }, 800); 
      }
    };

    scanner.render(onScanSuccess, (err) => {});
    return () => scanner.clear().catch(e => console.error(e));
  }, [profile]);

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-red-500">
        <ShieldAlert className="w-20 h-20 mb-4" />
        <h1 className="text-2xl font-black uppercase">Unauthorized Access</h1>
        <button onClick={() => navigate('/')} className="mt-8 px-8 py-3 bg-zinc-800 text-white rounded-2xl">Return Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-12 px-6">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
            <ArrowLeft className="w-5 h-5" /> Exit Scanner
            </button>
            <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
                <Zap className="w-4 h-4 fill-current" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Turbo Mode</span>
            </div>
        </div>

        <div className="bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-800 shadow-2xl overflow-hidden relative">
          <div id="reader" className="overflow-hidden rounded-3xl border-0"></div>
          
          {scanResult && (
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl animate-in fade-in zoom-in duration-200 ${
              scanResult === 'success' ? 'bg-green-500/90' : 
              scanResult === 'warning' ? 'bg-amber-500/90' : 
              scanResult === 'processing' ? 'bg-indigo-600/90' : 'bg-red-600/90'
            }`}>
              {scanResult === 'success' && <CheckCircle className="w-20 h-20 mb-4 animate-bounce" />}
              {scanResult === 'error' && <XCircle className="w-20 h-20 mb-4" />}
              {scanResult === 'warning' && <AlertCircle className="w-20 h-20 mb-4" />}
              <h2 className="text-2xl font-black uppercase tracking-tighter">
                {scanResult === 'processing' ? 'Checking...' : scanResult.toUpperCase()}
              </h2>
              <p className="mt-2 font-bold leading-tight">{message}</p>
            </div>
          )}
        </div>
        <p className="mt-8 text-center text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">
            UniFlow Gate Protocol v3.0 • Voice Enabled
        </p>
      </div>
    </div>
  );
};

export default ScannerPage;
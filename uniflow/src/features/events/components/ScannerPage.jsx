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
  const lastScannedId = useRef(null);
  const isProcessing = useRef(false);

  // 🔊 AUDIO & VOICE ENGINE (Success Beep + Name Announcement)
  const playFeedback = (type, name = "") => {
    // 1. Digital Beep Logic
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'success') {
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch for success
        oscillator.type = 'sine';
      } else {
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // Low buzz for errors
        oscillator.type = 'square';
      }
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio context error:", e);
    }

    // 2. Pro Voice Welcome (Text-to-Speech)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Clear queue
      let text = "";
      if (type === 'success') text = `Welcome, ${name}`;
      if (type === 'error') text = `Access Denied`;
      if (type === 'warning') text = `Already Scanned`;
      if (type === 'security') text = `Unauthorized Organizer`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1; // Professional speed
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    // 🛡️ SECURITY: Block non-admins at the gate
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 15, // High FPS for smooth tracking
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] // Performance hack
      }
    );

    const onScanSuccess = async (decodedText) => {
      // Prevent double scans and processing loops
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

          // 🛡️ SECURITY: Cross-Event Organizer Check
          // IEEE Admin cannot scan for NSS Event (Unless SuperAdmin)
          if (profile.role !== 'super_admin' && data.eventCreatorId !== user.uid) {
            setScanResult('error');
            setMessage('Unauthorized: You are not the host of this event.');
            playFeedback('security');
          } 
          else if (data.checkedIn === true || data.status === 'attended') {
            setScanResult('warning');
            setMessage(`Already Scanned: Welcome back, ${data.userName}`);
            playFeedback('warning');
          } else {
            // Update Firestore with Entry Status
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
        setMessage('Network Error: Check connectivity.');
        playFeedback('error');
      } finally {
        // ⚡ TURBO RESET: 800ms gap for high-speed entry lines
        setTimeout(() => {
          isProcessing.current = false;
          lastScannedId.current = null;
          setScanResult(null);
        }, 800); 
      }
    };

    scanner.render(onScanSuccess, (err) => {});
    return () => scanner.clear().catch(e => console.error("Scanner clear error", e));
  }, [profile, user]);

  // Unauthorized UI
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-red-500">
        <ShieldAlert className="w-20 h-20 mb-4 animate-pulse" />
        <h1 className="text-2xl font-black uppercase tracking-tighter italic">Security Alert</h1>
        <p className="text-zinc-500 font-bold text-xs uppercase mt-2">Scanner access restricted to organizers.</p>
        <button onClick={() => navigate('/')} className="mt-8 px-10 py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-zinc-800 active:scale-95 transition-all">Return to Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-12 px-6">
      <div className="max-w-md mx-auto">
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
              <ArrowLeft className="w-5 h-5" /> Exit Console
            </button>
            <div className="flex items-center gap-2 text-indigo-400">
                <Zap className="w-4 h-4 fill-current animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Scanner Active</span>
            </div>
        </div>

        {/* Scanner Shell */}
        <div className="bg-zinc-900 rounded-[3rem] p-8 border border-zinc-800 shadow-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent pointer-events-none"></div>
          <div id="reader" className="overflow-hidden rounded-[2rem] border-0 shadow-inner"></div>
          
          {/* Dynamic Result Overlays */}
          {scanResult && (
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center backdrop-blur-2xl animate-in zoom-in fade-in duration-200 ${
              scanResult === 'success' ? 'bg-green-500/90' : 
              scanResult === 'warning' ? 'bg-amber-500/90' : 
              scanResult === 'processing' ? 'bg-indigo-600/90' : 'bg-red-600/90'
            }`}>
              {scanResult === 'success' && <CheckCircle className="w-24 h-24 mb-4 text-white animate-bounce" />}
              {scanResult === 'error' && <XCircle className="w-24 h-24 mb-4 text-white" />}
              {scanResult === 'warning' && <AlertCircle className="w-24 h-24 mb-4 text-white" />}
              {scanResult === 'processing' && <Zap className="w-24 h-24 mb-4 text-white animate-pulse" />}
              
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                {scanResult === 'processing' ? 'Verifying...' : scanResult.toUpperCase()}
              </h2>
              <p className="mt-3 font-bold text-lg leading-tight text-white/90 drop-shadow-md">{message}</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-10 space-y-4 text-center">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">
                UniFlow Gate Protocol v3.1 • Voice Enabled
            </p>
            <div className="flex justify-center gap-4 text-[10px] font-bold text-zinc-500 uppercase">
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Auth Secure</span>
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Cloud Sync</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;
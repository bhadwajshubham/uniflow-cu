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
  
  // Refs to handle scanning state without re-rendering
  const scannerRef = useRef(null);
  const isProcessing = useRef(false);
  const lastScannedId = useRef(null);

  // 🔊 AUDIO & VOICE ENGINE
  const playFeedback = (type, name = "") => {
    // Beep Logic
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
    } catch (e) {
      console.error("Audio error:", e);
    }

    // Voice Logic
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      let text = "";
      if (type === 'success') text = `Welcome, ${name}`;
      if (type === 'error') text = `Access Denied`;
      if (type === 'warning') text = `Already Scanned`;
      if (type === 'security') text = `Unauthorized`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0; 
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    // 🛡️ SECURITY: Block non-admins
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') return;

    // Initialize Scanner
    if (!scannerRef.current) {
        const scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            showTorchButtonIfSupported: true
          },
          false // verbose
        );
    
        scannerRef.current = scanner;
    
        const onScanSuccess = async (decodedText) => {
          if (isProcessing.current || decodedText === lastScannedId.current) return;
          
          isProcessing.current = true;
          lastScannedId.current = decodedText;
          setScanResult('processing');
          setMessage('Verifying...');
    
          try {
            // 1. Get Ticket
            // NOTE: Ensure your QR contains just the Ticket ID string
            const regRef = doc(db, 'registrations', decodedText);
            const regSnap = await getDoc(regRef);
    
            if (!regSnap.exists()) {
              setScanResult('error');
              setMessage('Invalid Ticket');
              playFeedback('error');
            } else {
              const data = regSnap.data();
    
              // 2. Security Check (Organizer)
              if (profile.role !== 'super_admin' && data.eventCreatorId !== user.uid) {
                setScanResult('error');
                setMessage('Wrong Event');
                playFeedback('security');
              } 
              // 3. Status Check
              else if (data.used === true) {
                setScanResult('warning');
                setMessage(`Already Used: ${data.userName}`);
                playFeedback('warning');
              } else {
                // 4. Success Update
                await updateDoc(regRef, {
                  used: true,
                  usedAt: serverTimestamp()
                });
                setScanResult('success');
                setMessage(data.userName);
                playFeedback('success', data.userName.split(' ')[0]);
              }
            }
          } catch (err) {
            console.error(err);
            setScanResult('error');
            setMessage('Scan Error');
            playFeedback('error');
          } finally {
            // Reset for next scan
            setTimeout(() => {
              isProcessing.current = false;
              lastScannedId.current = null;
              setScanResult(null);
              setMessage('');
            }, 2000); 
          }
        };
    
        scanner.render(onScanSuccess, (err) => { /* ignore errors */ });
    }

    // Cleanup
    return () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(e => console.error("Clear failed", e));
            scannerRef.current = null;
        }
    };
  }, [profile, user]);

  // Unauthorized UI
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-red-500">
        <ShieldAlert className="w-20 h-20 mb-4 animate-pulse" />
        <h1 className="text-2xl font-black uppercase">Restricted</h1>
        <button onClick={() => navigate('/')} className="mt-8 px-6 py-3 bg-zinc-800 text-white rounded-xl font-bold">Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase">
              <ArrowLeft className="w-5 h-5" /> Exit
            </button>
            <div className="flex items-center gap-2 text-indigo-400">
                <Zap className="w-4 h-4 fill-current animate-pulse" />
                <span className="text-[10px] font-black uppercase">Live</span>
            </div>
        </div>

        {/* Scanner Box */}
        <div className="bg-zinc-900 rounded-[2rem] p-4 border border-zinc-800 shadow-2xl overflow-hidden relative">
          <div id="reader" className="overflow-hidden rounded-xl"></div>
          
          {/* Result Overlay */}
          {scanResult && (
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md animate-in fade-in duration-200 ${
              scanResult === 'success' ? 'bg-green-500/80' : 
              scanResult === 'warning' ? 'bg-amber-500/80' : 
              scanResult === 'processing' ? 'bg-indigo-600/80' : 'bg-red-600/80'
            }`}>
              {scanResult === 'success' && <CheckCircle className="w-16 h-16 mb-2 text-white" />}
              {scanResult === 'error' && <XCircle className="w-16 h-16 mb-2 text-white" />}
              {scanResult === 'warning' && <AlertCircle className="w-16 h-16 mb-2 text-white" />}
              
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                {scanResult === 'processing' ? '...' : scanResult}
              </h2>
              <p className="mt-2 font-bold text-white text-sm">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;
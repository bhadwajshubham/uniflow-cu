import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner'; // ✅ NEW WORKING LIBRARY
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeft, Zap, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ScannerPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [message, setMessage] = useState('Align QR Code within the frame');
  const [lastScannedId, setLastScannedId] = useState(null);

  // 🗣️ HUMANIZED TTS ENGINE (Same as before)
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop scanning noise
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;  
    utterance.pitch = 1.05; 
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Zira"));
    if (naturalVoice) utterance.voice = naturalVoice;

    window.speechSynthesis.speak(utterance);
  };

  const getRandomWelcome = (name) => {
    const greetings = [
      `Welcome in, ${name}!`,
      `Good to see you, ${name}.`,
      `Access granted for ${name}.`,
      `You are all set, ${name}!`,
      `Enjoy the event, ${name}.`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  // 📷 HANDLE SCAN (Updated for new library)
  const handleScan = async (detectedCodes) => {
    // The new library returns an array of detected codes
    if (!detectedCodes || detectedCodes.length === 0) return;
    
    const rawValue = detectedCodes[0].rawValue;
    if (!rawValue) return;

    // Prevent double-scanning the same ticket instantly
    if (status !== 'idle' || rawValue === lastScannedId) return;

    setLastScannedId(rawValue);
    setStatus('processing');
    setMessage('Verifying...');
    
    try {
      // 1. Get Ticket from Firestore
      const ticketRef = doc(db, 'registrations', rawValue);
      const ticketSnap = await getDoc(ticketRef);

      if (!ticketSnap.exists()) {
        throw new Error("Invalid Ticket ID");
      }

      const ticket = ticketSnap.data();

      // 2. Security Check: Is this YOUR event?
      // (Admins/SuperAdmins can scan any, Organizers only scan their own)
      if (ticket.eventCreatorId !== user.uid && user.role !== 'super_admin' && user.role !== 'admin') {
         setStatus('error');
         setMessage("Wrong Event");
         speak("This ticket is for a different organizer.");
         setTimeout(() => setStatus('idle'), 2500);
         return;
      }

      // 3. Duplicate Check
      if (ticket.used) {
        setStatus('error');
        const time = ticket.usedAt ? new Date(ticket.usedAt.toDate()).toLocaleTimeString() : 'Earlier';
        setMessage(`Already Used at ${time}`);
        speak(`Stop. ${ticket.userName.split(' ')[0]} has already entered.`);
        setTimeout(() => setStatus('idle'), 3000);
        return;
      }

      // 4. Success: Mark as Present
      await updateDoc(ticketRef, {
        used: true,
        usedAt: serverTimestamp()
      });

      setStatus('success');
      setScanResult(ticket);
      setMessage(`${ticket.userName} • Verified`);
      speak(getRandomWelcome(ticket.userName.split(' ')[0]));
      
      // Reset after 2.5 seconds
      setTimeout(() => {
        setStatus('idle');
        setScanResult(null);
        setLastScannedId(null);
        setMessage('Ready for next...');
      }, 2500);

    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(err.message === "Invalid Ticket ID" ? "Invalid QR Code" : "Scan Error");
      speak("Invalid Ticket.");
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${
      status === 'success' ? 'bg-green-500' : 
      status === 'error' ? 'bg-red-600' : 
      'bg-black'
    }`}>
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center z-10 relative">
        <button onClick={() => navigate('/admin')} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md hover:bg-white/20 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-md">
          <Zap className={`w-4 h-4 ${status === 'idle' ? 'text-white' : 'text-yellow-400 animate-pulse'}`} />
          <span className="text-xs font-bold text-white uppercase tracking-widest">
            {status === 'idle' ? 'Live Scanner' : status}
          </span>
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        
        {/* The Camera Component */}
        <div className="absolute inset-0 w-full h-full">
           <Scanner 
              onScan={handleScan}
              formats={['qr_code']} // Only scan QRs
              components={{
                audio: false, // Turn off library beep (we use our own TTS)
                finder: false // We use our own UI overlay
              }}
              styles={{
                container: { width: '100%', height: '100%' },
                video: { objectFit: 'cover' }
              }}
           />
        </div>

        {/* Overlay UI */}
        <div className="relative z-10 flex flex-col items-center gap-6 pointer-events-none">
          
          {/* Scanner Box */}
          <div className={`w-64 h-64 border-4 rounded-3xl flex items-center justify-center transition-all duration-300 ${
            status === 'success' ? 'border-white scale-110 bg-green-500/20' : 
            status === 'error' ? 'border-white scale-90 bg-red-600/20' : 
            'border-white/50 animate-pulse'
          }`}>
             {status === 'success' && <CheckCircle className="w-24 h-24 text-white drop-shadow-lg" />}
             {status === 'error' && <XCircle className="w-24 h-24 text-white drop-shadow-lg" />}
          </div>

          {/* Message Box */}
          <div className="bg-black/60 backdrop-blur-xl px-8 py-4 rounded-2xl text-center max-w-xs shadow-2xl">
            <p className="text-white font-black text-lg leading-tight mb-1">
              {message}
            </p>
            {scanResult && (
               <p className="text-green-400 text-xs font-bold uppercase tracking-wider mt-1">
                 Roll: {scanResult.userRollNo}
               </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ScannerPage;
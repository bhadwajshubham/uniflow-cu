import React, { useEffect, useState } from 'react';
import { QrReader } from 'react-qr-reader'; // Ensure you have installed: npm i react-qr-reader
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeft, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ScannerPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, scanning, success, error
  const [message, setMessage] = useState('Align QR Code within the frame');
  const [lastScannedId, setLastScannedId] = useState(null);

  // 🗣️ HUMANIZED TTS ENGINE
  const speak = (text, type = 'neutral') => {
    if (!window.speechSynthesis) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 🎛️ TUNING FOR HUMAN FEEL
    utterance.rate = 0.9;  // Slightly slower than default (1.0)
    utterance.pitch = 1.05; // Slightly higher/happier pitch
    utterance.volume = 1.0;

    // Try to pick a "Natural" voice if available (Google US English or Microsoft Zira)
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

  const handleScan = async (result, error) => {
    if (!result?.text) return;
    if (status === 'processing' || status === 'success' || status === 'error') return; // Debounce
    
    // Check if we just scanned this to prevent double-fire
    if (result.text === lastScannedId) return;

    setLastScannedId(result.text);
    setStatus('processing');
    
    try {
      // QR Format expected: eventId_userId_timestamp OR just ticketId
      // Let's assume the QR string is the Ticket Document ID for simplicity
      // OR parse the string if you used the complex format: const [eventId, userId] = result.text.split('_');
      
      // For this implementation, let's assume QR contains the logic we built: eventId_userId_timestamp
      // BUT for security, it is safer if the QR just held the TICKET DOCUMENT ID. 
      // Let's support the complex string by splitting it, but we need the Ticket Doc ID to update it.
      // Since finding the ticket by fields is slow, let's assume we change Ticket Generation to just store TicketID.
      // IF you stuck to `eventId_userId_timestamp`, we have to query.
      // LET'S ASSUME FOR NOW you are scanning the raw string.
      
      // ⚠️ CRITICAL: The safest way is to Query based on the data in QR
      const parts = result.text.split('_');
      let ticketRef;
      
      if (parts.length >= 2) {
         // It's our complex format: eventId_userId_timestamp
         // We need to find the registration doc.
         // This is tricky without Doc ID. 
         // FIX: In a real app, encoded string should be the Doc ID.
         // Let's assume for this fix, we are just parsing the text.
         // **Recommendation:** Update TicketPage QR to be just `ticket.id`.
         
         // For now, let's throw error if not simple ID, or try to handle it.
         throw new Error("Invalid QR Format. Use Ticket ID.");
      } else {
         // Simple Ticket ID
         ticketRef = doc(db, 'registrations', result.text);
      }

      const ticketSnap = await getDoc(ticketRef);

      if (!ticketSnap.exists()) {
        setStatus('error');
        setMessage("Invalid Ticket");
        speak("Invalid Ticket. Access Denied.");
        setTimeout(() => setStatus('idle'), 2000);
        return;
      }

      const ticket = ticketSnap.data();

      // 1. Check Event Ownership (Security)
      if (ticket.eventCreatorId !== user.uid && user.role !== 'super_admin') {
        setStatus('error');
        setMessage("Wrong Event");
        speak("This ticket is for a different organizer.");
        setTimeout(() => setStatus('idle'), 2000);
        return;
      }

      // 2. Check Duplicate Entry
      if (ticket.used) {
        setStatus('error');
        setMessage(`Already Scanned: ${ticket.usedAt ? new Date(ticket.usedAt.toDate()).toLocaleTimeString() : ''}`);
        speak(`Stop. ${ticket.userName} has already entered.`);
        setTimeout(() => setStatus('idle'), 3000);
        return;
      }

      // 3. Mark as Present
      await updateDoc(ticketRef, {
        used: true,
        usedAt: serverTimestamp()
      });

      setStatus('success');
      setScanResult(ticket);
      setMessage(`${ticket.userName} • ${ticket.userRollNo}`);
      speak(getRandomWelcome(ticket.userName.split(' ')[0])); // Speak first name
      
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
      setMessage("Scan Failed");
      speak("Error reading ticket.");
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
      <div className="p-6 flex justify-between items-center z-10">
        <button onClick={() => navigate('/admin')} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-md">
          <Zap className={`w-4 h-4 ${status === 'scanning' ? 'text-yellow-400 animate-pulse' : 'text-white'}`} />
          <span className="text-xs font-bold text-white uppercase tracking-widest">
            {status === 'idle' ? 'Live Scanner' : status}
          </span>
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        
        {/* The Camera */}
        <div className="absolute inset-0 w-full h-full">
           <QrReader
              onResult={handleScan}
              constraints={{ facingMode: 'environment' }}
              className="w-full h-full object-cover"
              scanDelay={500}
           />
        </div>

        {/* Overlay UI */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          
          {/* Scanner Frame */}
          <div className={`w-64 h-64 border-4 rounded-3xl flex items-center justify-center transition-all duration-300 ${
            status === 'success' ? 'border-white scale-110 bg-green-500/20' : 
            status === 'error' ? 'border-white scale-90 bg-red-600/20' : 
            'border-white/50 animate-pulse'
          }`}>
             {status === 'success' && <CheckCircle className="w-24 h-24 text-white drop-shadow-lg" />}
             {status === 'error' && <XCircle className="w-24 h-24 text-white drop-shadow-lg" />}
          </div>

          {/* Feedback Text */}
          <div className="bg-black/60 backdrop-blur-xl px-8 py-4 rounded-2xl text-center max-w-xs">
            <p className="text-white font-black text-lg leading-tight mb-1">
              {message}
            </p>
            {scanResult && (
               <p className="text-green-400 text-xs font-bold uppercase tracking-wider">Verified Ticket</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ScannerPage;
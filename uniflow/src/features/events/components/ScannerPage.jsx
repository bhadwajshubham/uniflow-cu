import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, ShieldAlert } from 'lucide-react';

const ScannerPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [scanResult, setScanResult] = useState(null); 
  const [message, setMessage] = useState('');
  const lastScannedId = useRef(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    // 🛡️ SECURITY AUDIT FIX: Block non-admins from even initializing the camera
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return;
    }

    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, // ⚡ TESTER FIX: Optimized to 10fps to prevent heating
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0,
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
        } else {
          const data = regSnap.data();
          if (data.status === 'attended' || data.status === 'used') {
            setScanResult('warning');
            setMessage(`Already Used: Scanned at ${data.attendedAt?.toDate().toLocaleTimeString()}`);
          } else {
            await updateDoc(regRef, {
              status: 'attended',
              attendedAt: serverTimestamp()
            });
            setScanResult('success');
            setMessage(`Access Granted: Welcome, ${data.userName}!`);
          }
        }
      } catch (err) {
        setScanResult('error');
        setMessage('Network Error: Could not verify.');
      } finally {
        setTimeout(() => {
          isProcessing.current = false;
          lastScannedId.current = null;
          setScanResult(null);
        }, 3000);
      }
    };

    scanner.render(onScanSuccess, (err) => {});
    return () => scanner.clear();
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
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Exit Scanner
        </button>

        <div className="bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-800 shadow-2xl overflow-hidden relative">
          <div id="reader" className="overflow-hidden rounded-3xl border-0"></div>
          
          {scanResult && (
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl animate-in fade-in duration-300 ${
              scanResult === 'success' ? 'bg-green-500/90' : 
              scanResult === 'warning' ? 'bg-amber-500/90' : 
              scanResult === 'processing' ? 'bg-indigo-600/90' : 'bg-red-600/90'
            }`}>
              {scanResult === 'success' && <CheckCircle className="w-20 h-20 mb-4 animate-bounce" />}
              {scanResult === 'error' && <XCircle className="w-20 h-20 mb-4" />}
              {scanResult === 'warning' && <AlertCircle className="w-20 h-20 mb-4" />}
              <h2 className="text-2xl font-black uppercase tracking-tighter">{scanResult.toUpperCase()}</h2>
              <p className="mt-2 font-bold leading-tight">{message}</p>
            </div>
          )}
        </div>
        <p className="mt-8 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">Gate Security Protocol v2.1</p>
      </div>
    </div>
  );
};

export default ScannerPage;
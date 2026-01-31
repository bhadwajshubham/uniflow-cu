import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import { ShieldCheck, Loader2, CheckCircle, LogOut } from 'lucide-react';

const VerificationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Checkbox States
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Check if user is already verified
  useEffect(() => {
    const checkUserStatus = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          // Agar pehle se accepted hai, toh seedha home bhejo
          if (data.termsAccepted) {
            navigate('/'); 
          }
        }
      } catch (error) {
        console.error("Check Error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [navigate]);

  // Handle Accept Logic
  const handleAccept = async () => {
    if (!termsAccepted || !privacyAccepted) {
      alert("Please accept both Terms & Conditions and Privacy Policy to continue.");
      return;
    }

    setSubmitting(true);
    const user = auth.currentUser;

    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Update DB
      await updateDoc(userRef, {
        termsAccepted: true,
        termsAcceptedAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });

      // Redirect to Home
      navigate('/');
      
    } catch (error) {
      console.error("Error accepting terms:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4 relative">
      
      {/* Logout Option (In case they want to switch account) */}
      <button 
        onClick={handleLogout} 
        className="absolute top-6 right-6 text-zinc-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Logout
      </button>

      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        
        {/* Icon */}
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
          <ShieldCheck className="w-10 h-10" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">
          Consent Required
        </h1>
        <p className="text-zinc-500 text-sm mb-8 px-4 leading-relaxed">
          To ensure a safe and secure community for everyone at UniFlow, please review and accept our guidelines.
        </p>

        {/* Checkboxes Area */}
        <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-6 mb-8 text-left border border-zinc-100 dark:border-zinc-800 space-y-4">
          
          {/* Checkbox 1: Terms */}
          <div className="flex items-start gap-3">
            <div className="pt-1">
              <input 
                type="checkbox" 
                id="check_terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 cursor-pointer rounded"
              />
            </div>
            <label htmlFor="check_terms" className="text-sm font-bold text-zinc-600 dark:text-zinc-300 cursor-pointer select-none">
              I agree to the{' '}
              <Link 
                to="/terms" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline z-10 relative"
                onClick={(e) => e.stopPropagation()} // 🔥 FIX: Prevents checkbox toggle when clicking link
              >
                Terms & Conditions
              </Link>
            </label>
          </div>

          {/* Checkbox 2: Privacy */}
          <div className="flex items-start gap-3">
            <div className="pt-1">
              <input 
                type="checkbox" 
                id="check_privacy"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 cursor-pointer rounded"
              />
            </div>
            <label htmlFor="check_privacy" className="text-sm font-bold text-zinc-600 dark:text-zinc-300 cursor-pointer select-none">
              I agree to the{' '}
              <Link 
                to="/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline z-10 relative"
                onClick={(e) => e.stopPropagation()} // 🔥 FIX: Prevents checkbox toggle when clicking link
              >
                Privacy Policy
              </Link>
            </label>
          </div>

        </div>

        {/* Action Button */}
        <button 
          onClick={handleAccept}
          disabled={!termsAccepted || !privacyAccepted || submitting}
          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
            termsAccepted && privacyAccepted 
              ? 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 hover:scale-[1.02] active:scale-95' 
              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
          }`}
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <><CheckCircle className="w-5 h-5" /> Accept & Continue</>}
        </button>

      </div>
    </div>
  );
};

export default VerificationPage;
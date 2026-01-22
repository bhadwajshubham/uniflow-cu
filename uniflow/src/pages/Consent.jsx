import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';

const Consent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 🔒 HARD BLOCK: must be logged in
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleAccept = async () => {
    if (!acceptTerms || !acceptPrivacy) {
      setError('You must accept both Terms & Conditions and Privacy Policy.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const existing = snap.exists() ? snap.data() : {};

      /**
       * 🛡️ DATA INTEGRITY FIX
       * Do NOT overwrite existing profile fields.
       * Only fill missing values.
       */
      await setDoc(
        userRef,
        {
          termsAccepted: true,
          termsAcceptedAt: serverTimestamp(),
          email: existing.email || user.email,
          ...(existing.displayName ? {} : { displayName: user.displayName || '' })
        },
        { merge: true }
      );

      /**
       * 🔁 FORCE RELOAD (INTENTIONAL)
       * Ensures AuthContext re-reads Firestore
       * Prevents infinite consent redirect loops
       */
      window.location.replace('/');
    } catch (err) {
      console.error(err);
      setError('Failed to save consent. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <ShieldAlert className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
            Consent Required
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            Please review and accept to continue using UniFlow
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold">
            {error}
          </div>
        )}

        {/* Checkboxes */}
        <div className="space-y-4 text-sm">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 accent-indigo-600"
            />
            <span className="text-zinc-700 dark:text-zinc-300">
              I agree to the{' '}
              <Link
                to="/terms"
                target="_blank"
                className="text-indigo-600 dark:text-indigo-400 underline font-bold"
              >
                Terms & Conditions
              </Link>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
              className="mt-1 accent-indigo-600"
            />
            <span className="text-zinc-700 dark:text-zinc-300">
              I agree to the{' '}
              <Link
                to="/privacy"
                target="_blank"
                className="text-indigo-600 dark:text-indigo-400 underline font-bold"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>

        {/* Action */}
        <button
          onClick={handleAccept}
          disabled={saving}
          className="mt-6 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Accept & Continue
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Consent;

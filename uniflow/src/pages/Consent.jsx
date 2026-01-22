import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';

const Consent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
      await setDoc(
        doc(db, 'users', user.uid),
        {
          termsAccepted: true,
          termsAcceptedAt: serverTimestamp(),
          email: user.email,              // 🔒 AUTH IS SOURCE OF TRUTH
          displayName: user.displayName || ''
        },
        { merge: true }
      );

      /**
       * ✅ FIX:
       * Let AuthContext re-run naturally
       * This avoids checkbox stuck + UI confusion
       */
      navigate('/', { replace: true });

    } catch (err) {
      console.error(err);
      setError('Failed to save consent. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 border shadow-xl">

        <div className="text-center mb-6">
          <ShieldAlert className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
          <h1 className="text-2xl font-black">Consent Required</h1>
          <p className="text-sm text-zinc-500 mt-2">
            Please review and accept to continue
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold">
            {error}
          </div>
        )}

        <div className="space-y-4 text-sm">
          <label className="flex gap-3">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={e => setAcceptTerms(e.target.checked)}
            />
            <span>
              I agree to the{' '}
              <Link to="/terms" target="_blank" className="underline font-bold">
                Terms & Conditions
              </Link>
            </span>
          </label>

          <label className="flex gap-3">
            <input
              type="checkbox"
              checked={acceptPrivacy}
              onChange={e => setAcceptPrivacy(e.target.checked)}
            />
            <span>
              I agree to the{' '}
              <Link to="/privacy" target="_blank" className="underline font-bold">
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>

        <button
          onClick={handleAccept}
          disabled={saving}
          className="mt-6 w-full py-4 bg-indigo-600 text-white rounded-xl font-black flex justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" /> : <CheckCircle />}
          Accept & Continue
        </button>
      </div>
    </div>
  );
};

export default Consent;

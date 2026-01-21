import React, { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export default function Consent() {
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!checked || !user) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        termsAccepted: true,
        termsAcceptedAt: serverTimestamp(),
        termsVersion: "v1"
      });
      window.location.replace("/");
    } catch (err) {
      console.error("Consent save failed", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm space-y-4">

        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Before you continue
        </h1>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please review and accept our Terms & Conditions and Privacy Policy to
          continue using UniFlow.
        </p>

        <div className="text-sm space-y-2">
          <a
            href="/terms"
            target="_blank"
            className="text-blue-600 dark:text-blue-400 underline block"
          >
            View Terms & Conditions
          </a>
          <a
            href="/privacy"
            target="_blank"
            className="text-blue-600 dark:text-blue-400 underline block"
          >
            View Privacy Policy
          </a>
        </div>

        <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1"
          />
          <span>
            I have read and agree to the Terms & Conditions and Privacy Policy
          </span>
        </label>

        <button
          onClick={handleAccept}
          disabled={!checked || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50 transition"
        >
          {loading ? "Saving..." : "Continue"}
        </button>

      </div>
    </div>
  );
}

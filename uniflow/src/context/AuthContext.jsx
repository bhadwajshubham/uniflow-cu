import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // ✅ Added for redirection
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

/**
 * 🛡️ AuthContext — FINAL HARDENED VERSION
 *
 * Security Guarantees:
 * - Atomic user provisioning (no race conditions)
 * - Auth token is the single source of truth (email)
 * - Privilege escalation is detected AND persisted
 * - Pre-seeded Firestore attacks are neutralized
 */

// 🔐 HARD ADMIN ALLOWLIST (temporary until Custom Claims)
const ADMIN_ALLOWLIST = [
  'bhardwajshubham0777@gmail.com'
];

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(undefined);
  const [loading, setLoading] = useState(true);

  // ✅ Hooks for redirection
  const navigate = useNavigate();
  const location = useLocation();

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      navigate('/login'); // Optional: Redirect to login after logout
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser || null);

      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);

      try {
        // 🔒 ATOMIC USER CREATION (RACE SAFE)
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(userRef);
          if (!snap.exists()) {
            tx.set(userRef, {
              displayName: currentUser.displayName || null,
              email: currentUser.email,
              photoURL: currentUser.photoURL || null,
              role: 'student',
              termsAccepted: false,
              createdAt: serverTimestamp()
            });
          }
        });

        // 🔍 LOAD PROFILE
        const freshSnap = await getDoc(userRef);
        if (!freshSnap.exists()) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const data = freshSnap.data();
        let needsUpdate = false;
        const updates = {};

        // 🔐 EMAIL = AUTH SOURCE OF TRUTH
        if (data.email !== currentUser.email) {
          updates.email = currentUser.email;
          data.email = currentUser.email;
          needsUpdate = true;
        }

        // 🔥 PRIVILEGE SANITIZATION (PERSISTED)
        if (
          (data.role === 'admin' || data.role === 'super_admin') &&
          !ADMIN_ALLOWLIST.includes(currentUser.email)
        ) {
          console.warn(
            `🚨 SECURITY: Unauthorized admin detected for ${currentUser.email}. Revoking.`
          );
          updates.role = 'student';
          data.role = 'student';
          needsUpdate = true;
        }

        // 💾 WRITE FIX BACK TO FIRESTORE (CRITICAL)
        if (needsUpdate) {
          await setDoc(userRef, updates, { merge: true });
        }

        setProfile(data);

        // 🚦 REDIRECTION LOGIC (Added)
        // Agar Terms accepted nahi hain, aur banda already profile pe nahi hai -> Profile pe bhejo
        if (data.termsAccepted === false) {
             // Sirf tab redirect karo jab hum login page ya home pe hon, taaki loop na bane
             if (window.location.pathname !== '/profile') {
                 console.log("⚠️ Consent pending. Redirecting to Profile...");
                 navigate('/profile'); 
             }
        }

      } catch (err) {
        console.error('AuthContext fatal error:', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]); // Added navigate dependency

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        login,
        logout,
        loading
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
import React, { createContext, useContext, useEffect, useState } from 'react';
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
 * AuthContext
 *
 * Responsibilities:
 * - Manage Firebase auth state
 * - Ensure a minimal users/{uid} doc exists on first sign-in
 * - Load & expose 'profile' (the users/{uid} doc) to app
 * - Expose login/logout, loading state
 *
 * SECURITY NOTE:
 * User provisioning is done inside a Firestore transaction
 * to prevent race conditions and privilege escalation.
 */

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Firebase auth user
  const [profile, setProfile] = useState(undefined); // undefined = loading, null = no doc
  const [loading, setLoading] = useState(true);

  // Google Sign-in
  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // onAuthStateChanged handles the rest
  };

  // Logout
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
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

      try {
        const userRef = doc(db, 'users', currentUser.uid);

        /**
         * 🔐 CRITICAL SECURITY FIX
         * Atomic user provisioning to prevent race conditions.
         * Ensures only ONE initialization can ever occur.
         */
        await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(userRef);

          if (!snap.exists()) {
            transaction.set(
              userRef,
              {
                displayName: currentUser.displayName || null,
                email: currentUser.email || null,
                photoURL: currentUser.photoURL || null,
                termsAccepted: false,
                createdAt: serverTimestamp()
              },
              { merge: true }
            );
          }
        });

        // Load profile after ensuring existence
        const freshSnap = await getDoc(userRef);
        if (freshSnap.exists()) {
          setProfile(freshSnap.data());
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Error ensuring user doc / loading profile', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    login,
    logout,
    loading
  };

  // Prevent route flicker until auth + profile are ready
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

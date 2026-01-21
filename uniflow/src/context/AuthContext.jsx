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
  serverTimestamp
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
 * This is deliberately conservative: creating the user doc with termsAccepted:false
 * so Firestore rules (which require existence) behave predictably.
 */

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // firebase auth user
  const [profile, setProfile] = useState(undefined); // user's firestore doc; undefined = not loaded yet, null = no doc
  const [loading, setLoading] = useState(true);

  // Sign-in (Google)
  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // onAuthStateChanged handles the rest
  };

  // Logout
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      // state will be cleared by onAuthStateChanged handler below
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  useEffect(() => {
    // Subscribe to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser || null);

      if (!currentUser) {
        // Not logged in — clear profile
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // Ensure minimal user doc exists so rules relying on exists(...) behave
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          // Create a minimal doc. We intentionally set termsAccepted:false so user is forced to accept
          await setDoc(
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

        // Fetch the user document again to populate profile
        const freshSnap = await getDoc(userRef);
        if (freshSnap.exists()) {
          setProfile(freshSnap.data());
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Error ensuring user doc / loading profile', err);
        // Make profile explicit null so RequireConsent can respond (but still avoid undefined race)
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Keep the context shape you were using
  const value = {
    user,
    profile, // user's firestore doc (object), or null (no doc), or undefined (loading)
    login,
    logout,
    loading
  };

  // IMPORTANT: do not render children until initial loading finished to avoid route flicker
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

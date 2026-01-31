import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(undefined);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation(); // Hook to get current path

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
      navigate('/login');
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
        // 🔒 ATOMIC USER CREATION
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(userRef);
          if (!snap.exists()) {
            tx.set(userRef, {
              displayName: currentUser.displayName || 'Student',
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
        if (freshSnap.exists()) {
            const data = freshSnap.data();
            
            // Sync Email if changed
            if (data.email !== currentUser.email) {
                await setDoc(userRef, { email: currentUser.email }, { merge: true });
                data.email = currentUser.email;
            }

            setProfile(data);

            // ============================================================
            // 🚦 REDIRECTION LOGIC (FIXED) 🚦
            // ============================================================
            
            // Ye wo pages hain jo bina Terms Accept kiye dikhne chahiye
            const publicPages = ['/profile', '/terms', '/privacy', '/about', '/login'];
            const currentPath = window.location.pathname;

            // Check: Agar Terms accepted nahi hai
            if (data.termsAccepted === false) {
                // Aur agar banda kisi PUBLIC page pe nahi hai
                if (!publicPages.includes(currentPath)) {
                    console.log("Redirecting to profile for consent...");
                    navigate('/profile'); 
                }
            }
        } else {
            setProfile(null);
        }

      } catch (err) {
        console.error('AuthContext Error:', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]); // Removed location dependency to avoid loop

  return (
    <AuthContext.Provider value={{ user, profile, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Login Function
  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // 🔥 CRITICAL FIX: Check if user exists in DB, if not, CREATE THEM
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log("🆕 New User Detected! Creating Database Profile...");
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: 'student', // Default role
          createdAt: serverTimestamp(),
        });
      } else {
        console.log("✅ Existing User Logged In. Fetching Profile...");
      }
      
      return user;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  // 2. Logout Function
  const logout = () => signOut(auth);

  // 3. Monitor Auth State & Fetch Profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch the profile from Firestore to get the ROLE
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setProfile(userSnap.data());
          // Debug Log
          console.log("👤 Profile Loaded:", userSnap.data());
        } else {
          // Fallback if DB doc is missing even after login
          console.warn("⚠️ User authenticated but no DB profile found.");
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    profile, // This contains the 'role' (admin/student)
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
import { db } from '../../../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const syncUserWithDb = async (user) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  // Extract domain (e.g., "chitkara.edu.in" or "gmail.com")
  const emailDomain = user.email.split('@')[1];
  
  // Logic: If domain is 'chitkara.edu.in', they are "verified". Else "guest".
  // You can add other universities here later easily!
  const isUniversityEmail = emailDomain === 'chitkara.edu.in'; 
  
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailDomain: emailDomain,
    // If they are new, set role based on email. Existing users keep their role.
    role: userSnap.exists() ? userSnap.data().role : (isUniversityEmail ? 'student' : 'guest'),
    isVerified: isUniversityEmail,
    lastLogin: serverTimestamp(),
  };

  // If user is new, add 'createdAt'
  if (!userSnap.exists()) {
    userData.createdAt = serverTimestamp();
  }

  // Save/Merge to Firestore
  // { merge: true } means: Don't delete existing data, just update what's new.
  await setDoc(userRef, userData, { merge: true });

  return userData;
};
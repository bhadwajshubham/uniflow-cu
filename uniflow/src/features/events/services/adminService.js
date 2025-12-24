import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

// 1. Get Participants (Existing)
export const getEventParticipants = async (eventId) => {
  try {
    const q = query(
      collection(db, 'registrations'), 
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching participants:", error);
    return [];
  }
};

// 2. Get Reviews (NEW)
export const getEventReviews = async (eventId) => {
  try {
    const q = query(
      collection(db, 'reviews'), 
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
};
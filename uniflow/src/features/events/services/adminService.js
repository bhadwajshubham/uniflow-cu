import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export const getEventParticipants = async (eventId) => {
  try {
    const q = query(
      collection(db, 'registrations'),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching participants:", error);
    throw error;
  }
};
import { db, storage } from '../../../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// 1. Upload Image
export const uploadEventImage = async (file) => {
  if (!file) return null;
  try {
    const storageRef = ref(storage, `events/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// 2. Create Event
export const createEvent = async (eventData) => {
  try {
    const docRef = await addDoc(collection(db, 'events'), eventData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

// 3. Update Event (NEW)
export const updateEvent = async (eventId, updatedData) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, updatedData);
    return { success: true };
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

// 4. Delete Event (NEW)
export const deleteEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, 'events', eventId));
    // Note: In a production app, you would also batch delete all 'registrations' for this event.
    // For MVP, leaving orphaned tickets is acceptable (they just won't load event data).
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

// 5. Fetch All Events
export const getAllEvents = async () => {
  try {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
};
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  where 
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const COLLECTION_NAME = 'events';

// Fetch all events (Public)
export const getEvents = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

// Fetch single event
export const getEventById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Event not found");
    }
  } catch (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
};

// 🔥 UPDATED: Create Event with Organizer Stamp
// You must pass 'userId' when calling this function from your Form!
export const createEvent = async (eventData, userId) => {
  if (!userId) throw new Error("User ID is required to create an event");

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...eventData,
      organizerId: userId, // 👈 THE STAMP (Ownership)
      ticketsSold: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

// Update Event (Admin only)
export const updateEvent = async (id, updates) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

// Delete Event
export const deleteEvent = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};
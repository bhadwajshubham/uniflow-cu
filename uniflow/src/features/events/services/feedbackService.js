import { db } from '../../../lib/firebase';
import { collection, doc, runTransaction, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

// 1. Submit a Review & Update Event Average
export const submitReview = async (eventId, user, rating, comment) => {
  if (!user) throw new Error("Must be logged in");

  // Create a predictable ID: eventId_userId
  // This allows us to check for duplicates efficiently inside the transaction
  const reviewId = `${eventId}_${user.uid}`;
  const reviewRef = doc(db, 'reviews', reviewId);
  const eventRef = doc(db, 'events', eventId);
  
  try {
    await runTransaction(db, async (transaction) => {
      // --- READ PHASE (Must come first) ---
      
      // 1. Read Event Data
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) throw new Error("Event does not exist");

      // 2. Read Review Data (Check if already exists)
      const reviewDoc = await transaction.get(reviewRef);
      if (reviewDoc.exists()) {
        throw new Error("You have already reviewed this event.");
      }

      // --- CALCULATE PHASE ---
      const data = eventDoc.data();
      const currentCount = data.totalReviews || 0;
      const currentRating = data.averageRating || 0;

      // New Average Logic
      const newCount = currentCount + 1;
      const newAverage = ((currentRating * currentCount) + rating) / newCount;

      // --- WRITE PHASE (Must come last) ---

      // 3. Create the Review
      transaction.set(reviewRef, {
        eventId,
        userId: user.uid,
        userName: user.displayName,
        userEmail: user.email,
        rating: parseInt(rating),
        comment,
        createdAt: serverTimestamp()
      });

      // 4. Update the Event stats
      transaction.update(eventRef, {
        averageRating: newAverage,
        totalReviews: newCount
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Review transaction failed:", error);
    // Pass the specific error message to the UI (e.g. "You have already reviewed...")
    throw error;
  }
};

// 2. Get Reviews (Helper)
export const getEventReviews = async (eventId) => {
  try {
    const q = query(collection(db, 'reviews'), where('eventId', '==', eventId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
};
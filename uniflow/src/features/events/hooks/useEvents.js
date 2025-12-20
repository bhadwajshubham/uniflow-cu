import { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Create a Query (Sort by Newest first)
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));

    // 2. Open a Real-Time Websocket Connection
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setEvents(eventsList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    // 3. Close connection when user leaves the page (Prevents memory leaks)
    return () => unsubscribe();
  }, []);

  return { events, loading };
};
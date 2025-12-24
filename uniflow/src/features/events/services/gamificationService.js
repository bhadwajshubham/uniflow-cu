import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const getLeaderboardData = async () => {
  try {
    // 1. Get ALL tickets that are marked as "attended"
    // Note: In a massive app, we would store 'points' on the user document.
    // For MVP (<10,000 tickets), counting them on the fly is free and accurate.
    const q = query(
      collection(db, 'registrations'), 
      where('status', '==', 'attended')
    );
    
    const snapshot = await getDocs(q);
    
    // 2. Aggregate Points by User
    const userPoints = {}; // { uid: { name, points, email } }

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const uid = data.userId;
      
      if (!userPoints[uid]) {
        userPoints[uid] = {
          userId: uid,
          userName: data.userName || 'Anonymous',
          userEmail: data.userEmail,
          eventsAttended: 0,
          points: 0
        };
      }
      
      userPoints[uid].eventsAttended += 1;
      userPoints[uid].points += 50; // 50 XP per event
    });

    // 3. Convert to Array and Sort (Highest Points First)
    const sortedLeaderboard = Object.values(userPoints)
      .sort((a, b) => b.points - a.points)
      .slice(0, 10); // Top 10 Only

    return sortedLeaderboard;

  } catch (error) {
    console.error("Error calculating leaderboard:", error);
    return [];
  }
};
import { db } from '../../../lib/firebase';
import { 
  doc, 
  runTransaction, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit,
  getDoc 
} from 'firebase/firestore';

const generateTeamCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

const shouldSendEmail = async () => {
  try {
    const settingsRef = doc(db, 'system', 'config');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) return true;
    return settingsSnap.data().emailEnabled !== false;
  } catch (error) {
    return true; 
  }
};

const sendTicketEmail = async (email, name, eventTitle, ticketId, teamCode) => {
  const emailAllowed = await shouldSendEmail();
  if (!emailAllowed) {
    console.log("High Traffic Mode: Email skipped.");
    return;
  }
  // (Email logic stub - you would implement actual fetch call here if you have a backend)
};

// 1. INDIVIDUAL REGISTRATION
export const registerForEvent = async (eventId, user) => {
  if (!user) throw new Error("User must be logged in");
  
  // 1a. Fetch Extended User Profile
  const userProfileRef = doc(db, 'users', user.uid);
  const userProfileSnap = await getDoc(userProfileRef);
  const userDetails = userProfileSnap.exists() ? userProfileSnap.data() : {};

  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) throw new Error("Event does not exist");
      const eventData = eventDoc.data();
      
      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out!");
      if (eventData.isRestricted && !user.email.endsWith('chitkara.edu.in')) throw new Error("University Students only.");

      const existingTicket = await transaction.get(registrationRef);
      if (existingTicket.exists()) throw new Error("Already registered.");

      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        clubName: eventData.clubName || 'University Board',
        eventDate: eventData.date,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        
        // Extended Details
        userPhone: userDetails.phone || 'N/A',
        userRollNo: userDetails.rollNo || 'N/A',
        userBranch: userDetails.branch || 'N/A',

        type: 'individual',
        createdAt: serverTimestamp(),
        status: 'confirmed'
      });

      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
    });

    sendTicketEmail(user.email, user.displayName, "Event", registrationRef.id, null);
    return { success: true };
  } catch (error) {
    console.error("Registration Failed:", error);
    throw error;
  }
};

// 2. REGISTER TEAM
export const registerTeam = async (eventId, user, teamName) => {
  if (!user) throw new Error("Login required");

  // 1a. Fetch Extended User Profile
  const userProfileRef = doc(db, 'users', user.uid);
  const userProfileSnap = await getDoc(userProfileRef);
  const userDetails = userProfileSnap.exists() ? userProfileSnap.data() : {};

  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const teamRef = doc(db, 'teams', `${eventId}_${teamName.replace(/\s+/g, '_').toLowerCase()}`);

  try {
    const teamCode = await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const eventData = eventDoc.data();
      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out!");

      const existingTicket = await transaction.get(registrationRef);
      if (existingTicket.exists()) throw new Error("Already registered.");
      
      const existingTeam = await transaction.get(teamRef);
      if (existingTeam.exists()) throw new Error("Team Name taken!");

      const code = generateTeamCode();

      transaction.set(teamRef, {
        eventId, teamName, teamCode: code, leaderId: user.uid, createdAt: serverTimestamp(), members: [user.uid]
      });

      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        clubName: eventData.clubName || 'University Board',
        eventDate: eventData.date,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        
        // Extended Details
        userPhone: userDetails.phone || 'N/A',
        userRollNo: userDetails.rollNo || 'N/A',
        userBranch: userDetails.branch || 'N/A',

        type: 'team_leader',
        teamId: teamRef.id,
        teamName, teamCode: code, 
        createdAt: serverTimestamp(),
        status: 'confirmed'
      });

      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
      return code;
    });

    sendTicketEmail(user.email, user.displayName, "Team Event", registrationRef.id, teamCode);
    return { success: true, teamCode };
  } catch (error) { throw error; }
};

// 3. JOIN TEAM
export const joinTeam = async (eventId, user, teamCode) => {
  // 1a. Fetch Extended User Profile
  const userProfileRef = doc(db, 'users', user.uid);
  const userProfileSnap = await getDoc(userProfileRef);
  const userDetails = userProfileSnap.exists() ? userProfileSnap.data() : {};

  const teamsRef = collection(db, 'teams');
  const q = query(teamsRef, where('teamCode', '==', teamCode), where('eventId', '==', eventId), limit(1));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) throw new Error("Invalid Team Code");

  const teamDoc = querySnapshot.docs[0];
  const teamData = teamDoc.data();
  const teamRef = doc(db, 'teams', teamDoc.id);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const eventRef = doc(db, 'events', eventId);

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const eventData = eventDoc.data();
      const existingTicket = await transaction.get(registrationRef);
      if (existingTicket.exists()) throw new Error("Already registered");
      
      const freshTeam = await transaction.get(teamRef);
      if ((freshTeam.data().members || []).length >= (eventData.maxTeamSize || 4)) throw new Error("Team Full");

      transaction.update(teamRef, { members: [...freshTeam.data().members, user.uid] });
      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        clubName: eventData.clubName || 'University Board',
        eventDate: eventData.date,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        
        // Extended Details
        userPhone: userDetails.phone || 'N/A',
        userRollNo: userDetails.rollNo || 'N/A',
        userBranch: userDetails.branch || 'N/A',

        type: 'team_member',
        teamId: teamDoc.id,
        teamName: teamData.teamName,
        teamCode: teamCode,
        createdAt: serverTimestamp(),
        status: 'confirmed'
      });
    });

    sendTicketEmail(user.email, user.displayName, "Team Join", registrationRef.id, teamCode);
    return { success: true, teamName: teamData.teamName };
  } catch (error) { throw error; }
};

export const checkRegistrationStatus = async (eventId, userId) => {
  if (!userId) return false;
  const q = query(collection(db, 'registrations'), where('eventId', '==', eventId), where('userId', '==', userId));
  const docSnap = await getDocs(q);
  return !docSnap.empty;
};

export const cancelRegistration = async (ticketId, eventId) => {
    const ticketRef = doc(db, 'registrations', ticketId);
    const eventRef = doc(db, 'events', eventId);
    
    try {
        await runTransaction(db, async (transaction) => {
            const ticketDoc = await transaction.get(ticketRef);
            if (!ticketDoc.exists()) throw new Error("Ticket not found");
            transaction.delete(ticketRef);
            const eventDoc = await transaction.get(eventRef);
            if (eventDoc.exists()) {
              const currentSold = eventDoc.data().ticketsSold || 0;
              if (currentSold > 0) {
                transaction.update(eventRef, { ticketsSold: currentSold - 1 });
              }
            }
        });
        return { success: true };
    } catch (e) { 
        console.error("Cancellation error:", e);
        throw e; 
    }
};
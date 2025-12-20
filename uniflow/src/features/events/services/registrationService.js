import { db } from '../../../lib/firebase';
import { 
  doc, 
  runTransaction, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit 
} from 'firebase/firestore';

// Helper: Generate a short 4-char code (e.g., A9X1)
const generateTeamCode = () => {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
};

// 1. INDIVIDUAL REGISTRATION
export const registerForEvent = async (eventId, user) => {
  if (!user) throw new Error("User must be logged in");

  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);

  try {
    await runTransaction(db, async (transaction) => {
      // Check Event
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) throw new Error("Event does not exist");
      
      const eventData = eventDoc.data();
      const currentSold = eventData.ticketsSold || 0;
      const maxTickets = parseInt(eventData.totalTickets);

      if (currentSold >= maxTickets) throw new Error("Event is Sold Out!");

      if (eventData.isRestricted && !user.email.endsWith('chitkara.edu.in')) {
        throw new Error("Restricted to University Students only.");
      }

      // Check Duplicate
      const existingTicket = await transaction.get(registrationRef);
      if (existingTicket.exists()) throw new Error("Already registered.");

      // Create Ticket
      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        type: 'individual',
        createdAt: serverTimestamp(),
        status: 'confirmed'
      });

      // Update Count
      transaction.update(eventRef, { ticketsSold: currentSold + 1 });
    });
    return { success: true };
  } catch (error) {
    console.error("Registration Failed:", error);
    throw error;
  }
};

// 2. REGISTER A NEW TEAM (LEADER)
export const registerTeam = async (eventId, user, teamName) => {
  if (!user) throw new Error("User must be logged in");
  if (!teamName) throw new Error("Team Name is required");

  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const teamRef = doc(db, 'teams', `${eventId}_${teamName.replace(/\s+/g, '_').toLowerCase()}`);

  try {
    const teamCode = await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) throw new Error("Event does not exist");
      
      const eventData = eventDoc.data();
      const currentSold = eventData.ticketsSold || 0;
      const maxTickets = parseInt(eventData.totalTickets);

      if (currentSold >= maxTickets) throw new Error("Event is Full!");

      const existingTicket = await transaction.get(registrationRef);
      if (existingTicket.exists()) throw new Error("You are already registered.");

      const existingTeam = await transaction.get(teamRef);
      if (existingTeam.exists()) throw new Error("Team Name already taken!");

      const code = generateTeamCode();

      // A. Create Team Doc
      transaction.set(teamRef, {
        eventId,
        teamName,
        teamCode: code,
        leaderId: user.uid,
        leaderName: user.displayName,
        members: [user.uid],
        createdAt: serverTimestamp()
      });

      // B. Create Leader Ticket (With Code)
      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        type: 'team_leader',
        teamId: teamRef.id,
        teamName: teamName,
        teamCode: code, 
        createdAt: serverTimestamp(),
        status: 'confirmed'
      });

      // C. Update Count (1 Team = 1 Slot)
      transaction.update(eventRef, { ticketsSold: currentSold + 1 });
      
      return code;
    });

    return { success: true, teamCode };

  } catch (error) {
    console.error("Team Registration Failed:", error);
    throw error;
  }
};

// 3. JOIN AN EXISTING TEAM (MEMBER)
export const joinTeam = async (eventId, user, teamCode) => {
  if (!user) throw new Error("User must be logged in");
  if (!teamCode) throw new Error("Team Code is required");

  // A. Find Team by Code
  const teamsRef = collection(db, 'teams');
  const q = query(teamsRef, where('teamCode', '==', teamCode), where('eventId', '==', eventId), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Invalid Team Code. Please check with your leader.");
  }

  const teamDoc = querySnapshot.docs[0];
  const teamData = teamDoc.data();
  const teamRef = doc(db, 'teams', teamDoc.id);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const eventRef = doc(db, 'events', eventId);

  try {
    await runTransaction(db, async (transaction) => {
      // Check Event
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) throw new Error("Event not found");
      const eventData = eventDoc.data();

      // Check User Duplicate
      const existingTicket = await transaction.get(registrationRef);
      if (existingTicket.exists()) throw new Error("You are already registered for this event.");

      // Check Team Size Limit
      const freshTeamDoc = await transaction.get(teamRef);
      const currentMembers = freshTeamDoc.data().members || [];
      const maxMembers = eventData.maxTeamSize || 4;

      if (currentMembers.length >= maxMembers) {
        throw new Error(`Team is full! (Max ${maxMembers} members)`);
      }

      // EXECUTE JOIN
      // 1. Add user to Team Member list
      transaction.update(teamRef, {
        members: [...currentMembers, user.uid]
      });

      // 2. Create Ticket for Member
      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        type: 'team_member',
        teamId: teamDoc.id,
        teamName: teamData.teamName,
        teamCode: teamCode,
        createdAt: serverTimestamp(),
        status: 'confirmed'
      });
      
      // Note: We DO NOT increment 'ticketsSold' because the slot was taken by the Team Leader.
    });

    return { success: true, teamName: teamData.teamName };

  } catch (error) {
    console.error("Join Team Failed:", error);
    throw error;
  }
};

// Helper
export const checkRegistrationStatus = async (eventId, userId) => {
  if (!userId) return false;
  // Simple check if doc exists
  const docRef = doc(db, 'registrations', `${eventId}_${userId}`);
  // We use query for safety
  const q = query(collection(db, 'registrations'), where('eventId', '==', eventId), where('userId', '==', userId));
  const docSnap = await getDocs(q);
  return !docSnap.empty;
};
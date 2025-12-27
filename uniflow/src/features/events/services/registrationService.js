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

// Stub for Email Service (Can be connected to SendGrid/Firebase Functions later)
const sendTicketEmail = async (email, name, eventTitle, ticketId, teamCode) => {
  console.log(`📧 [Mock Email] Sending ticket to ${email} for ${eventTitle}. TeamCode: ${teamCode}`);
};

// 1. INDIVIDUAL REGISTRATION
export const registerForEvent = async (eventId, user) => {
  if (!user) throw new Error("User must be logged in");
  
  // 1a. Try Fetch Extended User Profile (Roll No, Branch)
  // If we haven't built the User Profile setup page yet, this might be empty, so we fallback safely.
  let userDetails = {};
  try {
    const userProfileRef = doc(db, 'users', user.uid);
    const userProfileSnap = await getDoc(userProfileRef);
    if (userProfileSnap.exists()) userDetails = userProfileSnap.data();
  } catch (e) {
    console.warn("Could not fetch extended user profile:", e);
  }

  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) throw new Error("Event does not exist");
      const eventData = eventDoc.data();
      
      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out!");

      const existingTicket = await transaction.get(registrationRef);
      if (existingTicket.exists()) throw new Error("Already registered.");

      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        organizerName: eventData.organizerName || 'Admin',
        eventDate: eventData.date,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        
        // Extended Details (Safe Fallbacks)
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

  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  // Safe Team ID
  const teamDocId = `${eventId}_${teamName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
  const teamRef = doc(db, 'teams', teamDocId);

  try {
    const teamCode = await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const eventData = eventDoc.data();
      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out!");

      const existingTicket = await transaction.get(registrationRef);
      if (existingTicket.exists()) throw new Error("Already registered.");
      
      const code = generateTeamCode();

      transaction.set(teamRef, {
        eventId, teamName, teamCode: code, leaderId: user.uid, createdAt: serverTimestamp(), members: [user.uid]
      });

      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        organizerName: eventData.organizerName || 'Admin',
        eventDate: eventData.date,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        
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
      
      // Check Team Capacity (Default to 4 if not set)
      const maxMembers = eventData.teamSize ? parseInt(eventData.teamSize) : 4;
      if ((freshTeam.data().members || []).length >= maxMembers) throw new Error("Team Full");

      transaction.update(teamRef, { members: [...freshTeam.data().members, user.uid] });
      
      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        organizerName: eventData.organizerName || 'Admin',
        eventDate: eventData.date,
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

      // Increment global ticket count
      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
    });

    sendTicketEmail(user.email, user.displayName, "Team Join", registrationRef.id, teamCode);
    return { success: true, teamName: teamData.teamName };
  } catch (error) { throw error; }
};
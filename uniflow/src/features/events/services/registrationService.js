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

// 1. INDIVIDUAL REGISTRATION
export const registerForEvent = async (eventId, user) => {
  if (!user) throw new Error("User must be logged in");
  
  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);

  try {
    await runTransaction(db, async (transaction) => {
      // Get Event
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) throw new Error("Event does not exist");
      const eventData = eventDoc.data();
      
      // Validation
      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out!");

      // Check Duplicates
      const existingTicket = await transaction.get(registrationRef);
      if (existingTicket.exists()) throw new Error("Already registered.");

      // Create Ticket
      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        organizerName: eventData.organizerName || 'Admin',
        eventDate: eventData.date,
        eventLocation: eventData.location,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        userPhoto: user.photoURL,
        type: 'individual',
        createdAt: serverTimestamp(),
        status: 'confirmed'
      });

      // Update Count
      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
    });

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
  // Create a clean ID for the team document
  const teamDocId = `${eventId}_${teamName.replace(/\s+/g, '_').toLowerCase()}_${generateTeamCode()}`;
  const teamRef = doc(db, 'teams', teamDocId);

  try {
    const teamCode = await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const eventData = eventDoc.data();
      
      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out!");

      const existingTicket = await transaction.get(registrationRef);
      if (existingTicket.exists()) throw new Error("Already registered.");
      
      const code = generateTeamCode();

      // Create Team Doc
      transaction.set(teamRef, {
        eventId, 
        teamName, 
        teamCode: code, 
        leaderId: user.uid, 
        createdAt: serverTimestamp(), 
        members: [user.uid]
      });

      // Create Leader Ticket
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
        teamName, 
        teamCode: code, 
        createdAt: serverTimestamp(),
        status: 'confirmed'
      });

      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
      return code;
    });

    return { success: true, teamCode };
  } catch (error) { throw error; }
};

// 3. JOIN TEAM
export const joinTeam = async (eventId, user, teamCode) => {
  const teamsRef = collection(db, 'teams');
  // Find team by code AND eventId
  const q = query(teamsRef, where('teamCode', '==', teamCode), where('eventId', '==', eventId), limit(1));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) throw new Error("Invalid Team Code for this event");

  const teamDoc = querySnapshot.docs[0];
  const teamData = teamDoc.data();
  const teamRef = doc(db, 'teams', teamDoc.id);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const eventRef = doc(db, 'events', eventId);

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const eventData = eventDoc.data();
      
      // Check Capacity
      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Event Sold Out!");

      const existingTicket = await transaction.get(registrationRef);
      if (existingTicket.exists()) throw new Error("You are already registered.");
      
      const freshTeam = await transaction.get(teamRef);
      const currentMembers = freshTeam.data().members || [];
      
      // 🔥 FIX: Use 'teamSize' from event, default to 4 if missing
      const maxMembers = eventData.teamSize || 4; 
      if (currentMembers.length >= maxMembers) throw new Error("Team is Full!");

      // Add user to team
      transaction.update(teamRef, { members: [...currentMembers, user.uid] });

      // Create Ticket
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
      
      // Increment global sold count
      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
    });

    return { success: true, teamName: teamData.teamName };
  } catch (error) { throw error; }
};

export const cancelRegistration = async (ticketId, eventId) => {
    const ticketRef = doc(db, 'registrations', ticketId);
    const eventRef = doc(db, 'events', eventId);
    
    try {
        await runTransaction(db, async (transaction) => {
            const ticketDoc = await transaction.get(ticketRef);
            if (!ticketDoc.exists()) throw new Error("Ticket not found");
            transaction.delete(ticketRef);
            
            // Decrease count
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
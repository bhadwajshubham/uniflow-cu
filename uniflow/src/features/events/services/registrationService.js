import { db } from '../../../lib/firebase';
import { doc, runTransaction, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';

// Helper: Validation Logic
const validateRestrictions = (eventData, user, studentData) => {
  if (eventData.isUniversityOnly && !user.email.toLowerCase().endsWith('@chitkara.edu.in')) {
    throw new Error("🚫 Restricted: Official @chitkara.edu.in email required.");
  }
  if (eventData.allowedBranches === 'CSE/AI Only' && 
      !['B.E. (C.S.E.)', 'B.E. (C.S.E. AI)'].includes(studentData.branch)) {
    throw new Error("🚫 Restricted: CSE & AI branches only.");
  }
};

// 1. INDIVIDUAL REGISTRATION
export const registerForEvent = async (eventId, user, studentData) => {
  if (!user) throw new Error("User must be logged in");
  
  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  // Stats ref for analytics (optional, keeps track of emails sent via Cloud Function)
  const statsRef = doc(db, "system_stats", "daily_emails");

  try {
    await runTransaction(db, async (transaction) => {
      // READ PHASE
      const eventDoc = await transaction.get(eventRef);
      const existingReg = await transaction.get(registrationRef);
      const statsSnap = await transaction.get(statsRef);

      if (!eventDoc.exists()) throw new Error("Event does not exist");
      const eventData = eventDoc.data();
      
      validateRestrictions(eventData, user, studentData);

      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out!");
      if (existingReg.exists()) throw new Error("You are already registered.");

      // WRITE PHASE
      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        organizerName: eventData.organizerName || 'UniFlow Club',
        eventDate: eventData.date,
        eventTime: eventData.time || 'TBA',
        eventLocation: eventData.location,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        rollNo: studentData.rollNo,
        phone: studentData.phone,
        branch: studentData.branch,
        type: 'individual',
        status: 'confirmed',
        createdAt: serverTimestamp(),
        emailSent: false // Cloud function listens to this and flips it to true
      });

      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
      
      // Update Stats counter for the Cloud Function to track
      if (statsSnap.exists()) {
        transaction.update(statsRef, { count: (statsSnap.data().count || 0) + 1 });
      } else {
        transaction.set(statsRef, { count: 1 });
      }
    });

    return { success: true };
  } catch (error) { throw error; }
};

// 2. CREATE TEAM REGISTRATION
export const registerTeam = async (eventId, user, teamName, studentData) => {
  if (!user) throw new Error("Login required");
  if (!teamName || teamName.length < 3) throw new Error("Invalid Team Name");

  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase(); 

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const existingReg = await transaction.get(registrationRef);

      if (!eventDoc.exists()) throw new Error("Event not found");
      const eventData = eventDoc.data();

      validateRestrictions(eventData, user, studentData);

      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out!");
      if (existingReg.exists()) throw new Error("Already registered.");

      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        type: 'team_leader',
        teamName: teamName.trim(),
        teamCode: teamCode,
        teamSize: 1,
        maxTeamSize: eventData.teamSize || 4,
        status: 'confirmed',
        createdAt: serverTimestamp(),
        emailSent: false
      });

      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
    });

    return { success: true, teamCode };
  } catch (error) { throw error; }
};

// 3. JOIN TEAM REGISTRATION
export const joinTeam = async (eventId, user, teamCode, studentData) => {
  if (!user) throw new Error("Login required");
  if (!teamCode) throw new Error("Team Code required");

  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  
  const q = query(
    collection(db, 'registrations'), 
    where('eventId', '==', eventId),
    where('teamCode', '==', teamCode.trim().toUpperCase()),
    where('type', '==', 'team_leader'),
    limit(1)
  );

  const leaderQuerySnap = await getDocs(q);
  if (leaderQuerySnap.empty) throw new Error("Invalid Team Code");
  const leaderRef = leaderQuerySnap.docs[0].ref;

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const existingReg = await transaction.get(registrationRef);
      const leaderDoc = await transaction.get(leaderRef);

      if (!leaderDoc.exists()) throw new Error("Team Disbanded");
      const leaderData = leaderDoc.data();
      if (leaderData.teamSize >= leaderData.maxTeamSize) throw new Error("Team Full");

      if (!eventDoc.exists()) throw new Error("Event not found");
      const eventData = eventDoc.data();

      validateRestrictions(eventData, user, studentData);

      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out");
      if (existingReg.exists()) throw new Error("Already registered");

      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        type: 'team_member',
        teamName: leaderData.teamName,
        teamCode: leaderData.teamCode,
        status: 'confirmed',
        createdAt: serverTimestamp(),
        emailSent: false
      });

      transaction.update(leaderRef, { teamSize: leaderData.teamSize + 1 });
      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
    });

    return { success: true };
  } catch (error) { throw error; }
};
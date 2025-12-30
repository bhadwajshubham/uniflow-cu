import { db } from '../../../lib/firebase';
import { doc, runTransaction, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';

// Helper: Strict Validation Logic (Pure Logic, No DB calls)
const validateRestrictions = (eventData, user, studentData) => {
  // 1. University ID Check
  if (eventData.isUniversityOnly) {
    const email = user.email.toLowerCase();
    if (!email.endsWith('@chitkara.edu.in')) {
      throw new Error("🚫 Restricted: This event requires an official @chitkara.edu.in email ID.");
    }
  }

  // 2. Branch Check
  if (eventData.allowedBranches === 'CSE/AI Only') {
    if (studentData.branch !== 'B.E. (C.S.E.)' && studentData.branch !== 'B.E. (C.S.E. AI)') {
      throw new Error("🚫 Restricted: This event is exclusively for C.S.E. & C.S.E. AI branches.");
    }
  }
};

// 1. INDIVIDUAL REGISTRATION
export const registerForEvent = async (eventId, user, studentData) => {
  if (!user) throw new Error("User must be logged in");
  
  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const statsRef = doc(db, "system_stats", "daily_emails");

  try {
    await runTransaction(db, async (transaction) => {
      // ---------------- READ PHASE (MUST BE FIRST) ----------------
      const eventDoc = await transaction.get(eventRef);
      const existingReg = await transaction.get(registrationRef);
      const statsSnap = await transaction.get(statsRef);

      // ---------------- LOGIC PHASE ----------------
      if (!eventDoc.exists()) throw new Error("Event does not exist");
      const eventData = eventDoc.data();
      
      validateRestrictions(eventData, user, studentData);

      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out!");
      if (existingReg.exists()) throw new Error("You are already registered for this event.");

      // ---------------- WRITE PHASE (MUST BE LAST) ----------------
      
      // 1. Create Ticket
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
        residency: studentData.residency,
        group: studentData.group,
        branch: studentData.branch,
        showPublicly: studentData.showPublicly,

        type: 'individual',
        status: 'confirmed',
        createdAt: serverTimestamp(),
      });

      // 2. Update Ticket Count
      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });

      // 3. Update Email Stats
      if (statsSnap.exists()) {
        transaction.update(statsRef, { count: (statsSnap.data().count || 0) + 1 });
      } else {
        transaction.set(statsRef, { count: 1, isEmailActive: true });
      }
    });
    return { success: true };
  } catch (error) { throw error; }
};

// 2. CREATE TEAM REGISTRATION
export const registerTeam = async (eventId, user, teamName, studentData) => {
  if (!user) throw new Error("User must be logged in");
  if (!teamName || teamName.trim().length < 3) throw new Error("Team Name must be at least 3 chars");

  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const statsRef = doc(db, "system_stats", "daily_emails");
  
  const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase(); 

  try {
    await runTransaction(db, async (transaction) => {
      // ---------------- READ PHASE ----------------
      const eventDoc = await transaction.get(eventRef);
      const existingReg = await transaction.get(registrationRef);
      const statsSnap = await transaction.get(statsRef);

      // ---------------- LOGIC PHASE ----------------
      if (!eventDoc.exists()) throw new Error("Event does not exist");
      const eventData = eventDoc.data();

      validateRestrictions(eventData, user, studentData);

      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out!");
      if (existingReg.exists()) throw new Error("You are already registered.");

      // ---------------- WRITE PHASE ----------------
      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        organizerName: eventData.organizerName,
        eventDate: eventData.date,
        eventLocation: eventData.location,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,

        rollNo: studentData.rollNo,
        phone: studentData.phone,
        residency: studentData.residency,
        group: studentData.group,
        branch: studentData.branch,
        
        type: 'team_leader',
        teamName: teamName.trim(),
        teamCode: teamCode,
        teamSize: 1,
        maxTeamSize: eventData.teamSize || 4,
        
        status: 'confirmed',
        createdAt: serverTimestamp(),
      });

      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
      
      if (statsSnap.exists()) {
        transaction.update(statsRef, { count: (statsSnap.data().count || 0) + 1 });
      } else {
        transaction.set(statsRef, { count: 1, isEmailActive: true });
      }
    });
    return { success: true, teamCode };
  } catch (error) { throw error; }
};

// 3. JOIN TEAM REGISTRATION
export const joinTeam = async (eventId, user, teamCode, studentData) => {
  if (!user) throw new Error("User must be logged in");
  if (!teamCode) throw new Error("Team Code is required");

  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const statsRef = doc(db, "system_stats", "daily_emails");
  
  // Query for leader (Outside transaction because query inside is complex/limited)
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
      // ---------------- READ PHASE ----------------
      const eventDoc = await transaction.get(eventRef);
      const existingReg = await transaction.get(registrationRef);
      const leaderDoc = await transaction.get(leaderRef);
      const statsSnap = await transaction.get(statsRef);

      // ---------------- LOGIC PHASE ----------------
      if (!leaderDoc.exists()) throw new Error("Team disbanded.");
      const leaderData = leaderDoc.data();
      if (leaderData.teamSize >= leaderData.maxTeamSize) throw new Error("Team is full!");

      if (!eventDoc.exists()) throw new Error("Event does not exist");
      const eventData = eventDoc.data();

      validateRestrictions(eventData, user, studentData);

      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Event is Sold Out!");
      if (existingReg.exists()) throw new Error("Already registered.");

      // ---------------- WRITE PHASE ----------------
      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        
        rollNo: studentData.rollNo,
        phone: studentData.phone,
        residency: studentData.residency,
        group: studentData.group,
        branch: studentData.branch,
        
        type: 'team_member',
        teamName: leaderData.teamName,
        teamCode: leaderData.teamCode,
        
        status: 'confirmed',
        createdAt: serverTimestamp(),
      });

      transaction.update(leaderRef, { teamSize: leaderData.teamSize + 1 });
      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
      
      if (statsSnap.exists()) {
        transaction.update(statsRef, { count: (statsSnap.data().count || 0) + 1 });
      } else {
        transaction.set(statsRef, { count: 1, isEmailActive: true });
      }
    });

    return { success: true };
  } catch (error) { throw error; }
};
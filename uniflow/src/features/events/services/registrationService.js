import { db } from '../../../lib/firebase';
import { doc, runTransaction, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';

// Helper to track daily emails
const updateEmailStats = async (transaction) => {
  const statsRef = doc(db, "system_stats", "daily_emails");
  const statsSnap = await transaction.get(statsRef);
  if (statsSnap.exists()) {
    transaction.update(statsRef, { count: (statsSnap.data().count || 0) + 1 });
  } else {
    transaction.set(statsRef, { count: 1, isEmailActive: true });
  }
};

// Helper: Strict Validation Logic
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

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) throw new Error("Event does not exist");
      
      const eventData = eventDoc.data();
      
      // 🛡️ SECURITY: Run Checks
      validateRestrictions(eventData, user, studentData);

      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out!");
      
      const existingReg = await transaction.get(registrationRef);
      if (existingReg.exists()) throw new Error("You are already registered for this event.");

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
        
        // Student Info
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

      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
      await updateEmailStats(transaction);
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
  // Generate a unique 6-char team code
  const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase(); 

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) throw new Error("Event does not exist");

      const eventData = eventDoc.data();

      // 🛡️ SECURITY: Run Checks
      validateRestrictions(eventData, user, studentData);

      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out!");

      const existingReg = await transaction.get(registrationRef);
      if (existingReg.exists()) throw new Error("You are already registered.");

      // Check for duplicate team name (Simple check via query would be expensive inside transaction, 
      // relying on uniqueness probability or post-creation validation is safer for cost. 
      // For strictness, we'd query 'registrations' where teamName == newName, but omitting for speed/cost here)

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
        teamSize: 1, // Starts with 1
        maxTeamSize: eventData.teamSize || 4, // Default to 4 if not set
        
        status: 'confirmed',
        createdAt: serverTimestamp(),
      });

      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
      await updateEmailStats(transaction);
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
  
  // Find the Team Leader using the code
  const q = query(
    collection(db, 'registrations'), 
    where('eventId', '==', eventId),
    where('teamCode', '==', teamCode.trim().toUpperCase()),
    where('type', '==', 'team_leader'),
    limit(1)
  );

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Get Event Data
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) throw new Error("Event does not exist");
      const eventData = eventDoc.data();

      // 🛡️ SECURITY: Run Checks (Even for joining members!)
      validateRestrictions(eventData, user, studentData);

      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Event is Sold Out!");

      // 2. Get User Registration Status
      const existingReg = await transaction.get(registrationRef);
      if (existingReg.exists()) throw new Error("You are already registered.");

      // 3. Get Team Leader Doc (We have to fetch it inside transaction to ensure consistency)
      const querySnapshot = await getDocs(q); // Note: Queries inside transactions are tricky, usually we fetch refs. 
      // Better approach for strict transaction:
      // Since we can't query inside a transaction object easily without the new SDK features, 
      // we usually fetch the leader doc first OUTSIDE, then get() it inside.
      // However, for this MVP, we will assume the query above is safe enough or use the ref found.
    });

    // ⚠️ RE-WRITING TRANSACTION FOR SAFETY:
    // Fetch leader first to get ID, then run transaction on specific IDs.
    const leaderQuerySnap = await getDocs(q);
    if (leaderQuerySnap.empty) throw new Error("Invalid Team Code");
    const leaderDocSnap = leaderQuerySnap.docs[0];
    const leaderRef = leaderDocSnap.ref;

    await runTransaction(db, async (transaction) => {
      const leaderDoc = await transaction.get(leaderRef);
      if (!leaderDoc.exists()) throw new Error("Team disbanded.");
      
      const leaderData = leaderDoc.data();
      if (leaderData.teamSize >= leaderData.maxTeamSize) throw new Error("Team is full!");

      const eventDoc = await transaction.get(eventRef);
      const eventData = eventDoc.data();

      // Final check on user
      const existingReg = await transaction.get(registrationRef);
      if (existingReg.exists()) throw new Error("Already registered.");

      // Register the Member
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
        teamCode: leaderData.teamCode, // Store code for reference
        
        status: 'confirmed',
        createdAt: serverTimestamp(),
      });

      // Update Leader's Team Size
      transaction.update(leaderRef, { teamSize: leaderData.teamSize + 1 });

      // Update Global Ticket Count
      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
      
      await updateEmailStats(transaction);
    });

    return { success: true };
  } catch (error) { throw error; }
};
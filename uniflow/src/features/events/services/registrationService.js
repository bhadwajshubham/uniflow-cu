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

const generateTeamCode = () => Math.random().toString(36).substring(2, 7).toUpperCase();

/**
 * 📧 SUPERADMIN STATS TRACKER
 * Updates the global email counter within the current transaction
 */
const updateEmailStats = async (transaction) => {
  const statsRef = doc(db, "system_stats", "daily_emails");
  const statsSnap = await transaction.get(statsRef);
  if (statsSnap.exists()) {
    transaction.update(statsRef, { count: (statsSnap.data().count || 0) + 1 });
  }
};

/**
 * 🎓 STRICT CHITKARA EMAIL VALIDATOR
 */
const validateEmailDomain = (email) => {
  if (!email.toLowerCase().endsWith('@chitkara.edu.in')) {
    throw new Error("🚫 Access Denied: Please use your official @chitkara.edu.in email ID only.");
  }
};

/**
 * 1. INDIVIDUAL REGISTRATION
 */
export const registerForEvent = async (eventId, user, studentData) => {
  if (!user) throw new Error("User must be logged in");
  validateEmailDomain(user.email);
  
  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) throw new Error("Event does not exist");
      const eventData = eventDoc.data();
      
      // 🛡️ BRANCH ELIGIBILITY CHECK
      if (eventData.allowedBranches === 'CSE/AI Only') {
        if (studentData.branch !== 'B.E. (C.S.E.)' && studentData.branch !== 'B.E. (C.S.E. AI)') {
          throw new Error("🚫 Restricted: This event is exclusively for C.S.E. & C.S.E. AI branches.");
        }
      }

      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out!");
      
      const existingTicket = await transaction.get(registrationRef);
      if (existingTicket.exists()) throw new Error("You are already registered for this event.");

      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        organizerName: eventData.organizerName || 'UniFlow Club',
        eventDate: eventData.date,
        eventTime: eventData.time || 'TBA',
        eventLocation: eventData.location,
        whatsappLink: eventData.whatsappLink || '',
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        
        // Mandatory Student Info from Modal
        rollNo: studentData.rollNo,
        phone: studentData.phone,
        residency: studentData.residency,
        group: studentData.group,
        branch: studentData.branch,
        showPublicly: studentData.showPublicly,

        type: 'individual',
        createdAt: serverTimestamp(),
        status: 'confirmed'
      });

      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
      await updateEmailStats(transaction);
    });

    return { success: true };
  } catch (error) {
    console.error("Registration Failed:", error);
    throw error;
  }
};

/**
 * 2. CREATE TEAM (LEADER)
 */
export const registerTeam = async (eventId, user, teamName, studentData) => {
  if (!user) throw new Error("Login required");
  validateEmailDomain(user.email);

  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const teamDocId = `${eventId}_${teamName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
  const teamRef = doc(db, 'teams', teamDocId);

  try {
    const teamCode = await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const eventData = eventDoc.data();
      
      if (eventData.allowedBranches === 'CSE/AI Only') {
        if (studentData.branch !== 'B.E. (C.S.E.)' && studentData.branch !== 'B.E. (C.S.E. AI)') {
          throw new Error("🚫 Restricted: CSE/AI branches only.");
        }
      }

      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out!");
      if ((await transaction.get(registrationRef)).exists()) throw new Error("Already registered.");
      
      const code = generateTeamCode();

      transaction.set(teamRef, {
        eventId, teamName, teamCode: code, leaderId: user.uid, createdAt: serverTimestamp(), members: [user.uid]
      });

      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        organizerName: eventData.organizerName || 'UniFlow Club',
        eventDate: eventData.date,
        eventTime: eventData.time || 'TBA',
        eventLocation: eventData.location,
        whatsappLink: eventData.whatsappLink || '',
        userName: user.displayName,
        userEmail: user.email,
        userId: user.uid,
        rollNo: studentData.rollNo,
        phone: studentData.phone,
        residency: studentData.residency,
        group: studentData.group,
        branch: studentData.branch,
        showPublicly: studentData.showPublicly,
        type: 'team_leader',
        teamId: teamRef.id,
        teamName, 
        teamCode: code, 
        createdAt: serverTimestamp(),
        status: 'confirmed'
      });

      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
      await updateEmailStats(transaction);
      return code;
    });

    return { success: true, teamCode };
  } catch (error) { throw error; }
};

/**
 * 3. JOIN TEAM (MEMBER)
 */
export const joinTeam = async (eventId, user, teamCode, studentData) => {
  if (!user) throw new Error("Login required");
  validateEmailDomain(user.email);
  
  const teamsRef = collection(db, 'teams');
  const q = query(teamsRef, where('teamCode', '==', teamCode.toUpperCase()), where('eventId', '==', eventId), limit(1));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) throw new Error("Invalid Team Code. Ask your leader for the correct code.");

  const teamDoc = querySnapshot.docs[0];
  const teamData = teamDoc.data();
  const teamRef = doc(db, 'teams', teamDoc.id);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const eventRef = doc(db, 'events', eventId);

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const eventData = eventDoc.data();

      if (eventData.allowedBranches === 'CSE/AI Only') {
        if (studentData.branch !== 'B.E. (C.S.E.)' && studentData.branch !== 'B.E. (C.S.E. AI)') {
          throw new Error("🚫 Restricted: CSE/AI branches only.");
        }
      }
      
      if ((await transaction.get(registrationRef)).exists()) throw new Error("Already registered.");
      
      const freshTeam = await transaction.get(teamRef);
      const maxMembers = eventData.teamSize ? parseInt(eventData.teamSize) : 4;
      
      if ((freshTeam.data().members || []).length >= maxMembers) throw new Error("This team is already full!");

      transaction.update(teamRef, { members: [...freshTeam.data().members, user.uid] });
      
      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        organizerName: eventData.organizerName || 'UniFlow Club',
        eventDate: eventData.date,
        eventTime: eventData.time || 'TBA',
        eventLocation: eventData.location,
        whatsappLink: eventData.whatsappLink || '',
        userName: user.displayName,
        userEmail: user.email,
        userId: user.uid,
        rollNo: studentData.rollNo,
        phone: studentData.phone,
        residency: studentData.residency,
        group: studentData.group,
        branch: studentData.branch,
        showPublicly: studentData.showPublicly,
        type: 'team_member',
        teamId: teamDoc.id,
        teamName: teamData.teamName,
        teamCode: teamCode.toUpperCase(),
        createdAt: serverTimestamp(),
        status: 'confirmed'
      });

      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
      await updateEmailStats(transaction);
    });

    return { success: true, teamName: teamData.teamName };
  } catch (error) { throw error; }
};
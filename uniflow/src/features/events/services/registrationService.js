import { db } from '../../../lib/firebase';
import { doc, runTransaction, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
// 👇 IMPORT ADDED
import emailjs from '@emailjs/browser';

// 📧 EMAIL CONFIGURATION (REPLACE THESE WITH YOUR KEYS)
const EMAIL_CONFIG = {
  SERVICE_ID: "YOUR_SERVICE_ID",   // e.g. "service_gmail"
  TEMPLATE_ID: "YOUR_TEMPLATE_ID", // e.g. "template_ticket"
  PUBLIC_KEY: "YOUR_PUBLIC_KEY"    // e.g. "user_12345abcde"
};

// ✅ HELPER: SEND EMAIL (Frontend Only)
const triggerEmail = async (userEmail, userName, eventTitle, details, ticketId) => {
  try {
    await emailjs.send(
      EMAIL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.TEMPLATE_ID,
      {
        to_name: userName,
        to_email: userEmail,
        event_name: eventTitle,
        ticket_id: ticketId,
        details: details // Template mein {{details}} variable banayein
      },
      EMAIL_CONFIG.PUBLIC_KEY
    );
    console.log("✅ Email Sent via EmailJS");
  } catch (error) {
    console.error("❌ EmailJS Failed (Check Keys):", error);
    // Silent fail so user flow doesn't break
  }
};

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
  let eventDataForEmail = {}; // Store data for email

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const existingReg = await transaction.get(registrationRef);

      if (!eventDoc.exists()) throw new Error("Event does not exist");
      eventDataForEmail = eventDoc.data();
      
      validateRestrictions(eventDataForEmail, user, studentData);

      if ((eventDataForEmail.ticketsSold || 0) >= parseInt(eventDataForEmail.totalTickets)) throw new Error("Sold Out!");
      if (existingReg.exists()) throw new Error("You are already registered.");

      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventDataForEmail.title,
        organizerName: eventDataForEmail.organizerName || 'UniFlow Club',
        eventDate: eventDataForEmail.date,
        eventTime: eventDataForEmail.time || 'TBA',
        eventLocation: eventDataForEmail.location,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        rollNo: studentData.rollNo,
        phone: studentData.phone,
        branch: studentData.branch,
        type: 'individual',
        status: 'confirmed',
        createdAt: serverTimestamp(),
      });

      transaction.update(eventRef, { ticketsSold: (eventDataForEmail.ticketsSold || 0) + 1 });
    });

    // 🚀 SEND EMAIL NOW
    await triggerEmail(
      user.email,
      user.displayName,
      eventDataForEmail.title,
      `Date: ${eventDataForEmail.date} | Time: ${eventDataForEmail.time}`,
      `${eventId}_${user.uid}`
    );

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
  let eventDataForEmail = {};

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const existingReg = await transaction.get(registrationRef);

      if (!eventDoc.exists()) throw new Error("Event not found");
      eventDataForEmail = eventDoc.data();

      validateRestrictions(eventDataForEmail, user, studentData);

      if ((eventDataForEmail.ticketsSold || 0) >= parseInt(eventDataForEmail.totalTickets)) throw new Error("Sold Out!");
      if (existingReg.exists()) throw new Error("Already registered.");

      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventDataForEmail.title,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        type: 'team_leader',
        teamName: teamName.trim(),
        teamCode: teamCode,
        teamSize: 1,
        maxTeamSize: eventDataForEmail.teamSize || 4,
        status: 'confirmed',
        createdAt: serverTimestamp(),
      });

      transaction.update(eventRef, { ticketsSold: (eventDataForEmail.ticketsSold || 0) + 1 });
    });

    // 🚀 SEND EMAIL NOW
    await triggerEmail(
      user.email,
      user.displayName,
      eventDataForEmail.title,
      `Team: ${teamName} | Code: ${teamCode}`,
      `${eventId}_${user.uid}`
    );

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
  let eventDataForEmail = {};
  let teamName = "";

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const existingReg = await transaction.get(registrationRef);
      const leaderDoc = await transaction.get(leaderRef);

      if (!leaderDoc.exists()) throw new Error("Team Disbanded");
      const leaderData = leaderDoc.data();
      teamName = leaderData.teamName;
      if (leaderData.teamSize >= leaderData.maxTeamSize) throw new Error("Team Full");

      if (!eventDoc.exists()) throw new Error("Event not found");
      eventDataForEmail = eventDoc.data();

      validateRestrictions(eventDataForEmail, user, studentData);

      if ((eventDataForEmail.ticketsSold || 0) >= parseInt(eventDataForEmail.totalTickets)) throw new Error("Sold Out");
      if (existingReg.exists()) throw new Error("Already registered");

      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventDataForEmail.title,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        type: 'team_member',
        teamName: leaderData.teamName,
        teamCode: leaderData.teamCode,
        status: 'confirmed',
        createdAt: serverTimestamp(),
      });

      transaction.update(leaderRef, { teamSize: leaderData.teamSize + 1 });
      transaction.update(eventRef, { ticketsSold: (eventDataForEmail.ticketsSold || 0) + 1 });
    });

    // 🚀 SEND EMAIL NOW
    await triggerEmail(
      user.email,
      user.displayName,
      eventDataForEmail.title,
      `Joined Team: ${teamName}`,
      `${eventId}_${user.uid}`
    );

    return { success: true };
  } catch (error) { throw error; }
};
import { db } from '../lib/firebase';
import { doc, runTransaction, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * 📧 EMAIL LOGIC (Backend API call)
 */
const sendConfirmationEmail = async (userEmail, userName, eventTitle, ticketId, details) => {
  if (window.location.hostname === 'localhost' && window.location.port === '5173') return;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketId}`;
  const appUrl = window.location.origin; 
  const ticketLink = `${appUrl}/my-tickets`; 

  try {
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: userEmail,
        email: userEmail,
        subject: `🎟️ Ticket Confirmed: ${eventTitle}`,
        html: `
          <h1>UniFlow Events</h1>
          <p>Hi ${userName}, your spot for <strong>${eventTitle}</strong> is confirmed!</p>
          <img src="${qrCodeUrl}" alt="QR Code" style="width:150px;"/>
          <br/>
          <a href="${ticketLink}">View Ticket in App</a>
        `
      })
    });
  } catch (err) { console.error("Email Error:", err); }
};

const validateRestrictions = (eventData, user) => {
  if (eventData.isUniversityOnly && !user.email.toLowerCase().endsWith('@chitkara.edu.in')) {
    throw new Error("🚫 Restricted: Official @chitkara.edu.in email required.");
  }
};

// --- EXPORTED FUNCTIONS ---

export const registerForEvent = async (eventId, user, profile, answers = {}) => {
  if (!user) throw new Error("User must be logged in");
  
  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const statsRef = doc(db, "system_stats", "daily_emails");
  let eventData = {}; 

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const existingReg = await transaction.get(registrationRef);
      const statsSnap = await transaction.get(statsRef);

      if (!eventDoc.exists()) throw new Error("Event not found");
      eventData = eventDoc.data();

      validateRestrictions(eventData, user);

      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("SOLD_OUT");
      if (existingReg.exists()) throw new Error("ALREADY_BOOKED");

      transaction.set(registrationRef, {
        eventId,
        eventTitle: eventData.title,
        eventDate: eventData.date,
        eventTime: eventData.time || 'TBA',
        eventLocation: eventData.venue || eventData.location || 'Campus',
        eventImage: eventData.image || '',
        userId: user.uid,
        userEmail: user.email,
        userName: profile?.displayName || user.displayName,
        userRollNo: profile?.rollNo || 'N/A',
        userPhone: profile?.phone || 'N/A',
        answers: answers,
        type: 'individual',
        status: 'confirmed',
        createdAt: serverTimestamp(),
        used: false,
        qrCode: `TICKET-${eventId}-${user.uid}`
      });

      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
      
      if (statsSnap.exists()) transaction.update(statsRef, { count: (statsSnap.data().count || 0) + 1 });
      else transaction.set(statsRef, { count: 1 });
    });

    sendConfirmationEmail(user.email, user.displayName, eventData.title, `${eventId}_${user.uid}`, "");
    return { success: true };
  } catch (error) { throw error; }
};

export const registerTeam = async (eventId, user, teamName, studentData) => {
  if (!user) throw new Error("Login required");
  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase(); 
  
  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const existingReg = await transaction.get(registrationRef);
      if (!eventDoc.exists()) throw new Error("Event not found");
      const eventData = eventDoc.data();
      
      validateRestrictions(eventData, user);
      if ((eventData.ticketsSold || 0) >= parseInt(eventData.totalTickets)) throw new Error("Sold Out");
      if (existingReg.exists()) throw new Error("Already registered");

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
      });
      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
    });
    return { success: true, teamCode };
  } catch (error) { throw error; }
};

export const joinTeam = async (eventId, user, teamCode, studentData) => {
  if (!user) throw new Error("Login required");
  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const q = query(collection(db, 'registrations'), where('eventId', '==', eventId), where('teamCode', '==', teamCode.trim().toUpperCase()), where('type', '==', 'team_leader'), limit(1));

  try {
    const leaderSnap = await getDocs(q);
    if (leaderSnap.empty) throw new Error("Invalid Team Code");
    const leaderRef = leaderSnap.docs[0].ref;

    await runTransaction(db, async (transaction) => {
      const leaderDoc = await transaction.get(leaderRef);
      if (!leaderDoc.exists()) throw new Error("Team Disbanded");
      const leaderData = leaderDoc.data();
      if (leaderData.teamSize >= leaderData.maxTeamSize) throw new Error("Team Full");

      const eventDoc = await transaction.get(eventRef);
      const eventData = eventDoc.data();
      const existingReg = await transaction.get(registrationRef);
      
      validateRestrictions(eventData, user);
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
      });
      transaction.update(leaderRef, { teamSize: leaderData.teamSize + 1 });
      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
    });
    return { success: true };
  } catch (error) { throw error; }
};
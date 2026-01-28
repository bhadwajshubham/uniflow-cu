import { db } from '../../../lib/firebase';
import { doc, runTransaction, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * 📧 INTERNAL HELPER: Call Vercel API
 * Uses '/api/send-email' which maps to your backend function
 */
const sendConfirmationEmail = async (userEmail, userName, eventTitle, ticketId, details) => {
  // 🛡️ SKIP ON LOCALHOST (Vite Port 5173) to prevent Red 404 Errors
  if (window.location.hostname === 'localhost' && window.location.port === '5173') {
    console.log("🛑 Localhost Detected: Email API call skipped (Backend not available in Vite).");
    console.log(`📨 [MOCK EMAIL] To: ${userEmail} | Subject: Ticket for ${eventTitle}`);
    return;
  }

  console.log(`📨 Sending email to ${userEmail} via Backend API...`);
  
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: userEmail,
        subject: `🎟️ Ticket: ${eventTitle}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
            <h2 style="color: #4f46e5; margin-bottom: 10px;">You're In! 🚀</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Your ticket for <strong>${eventTitle}</strong> is confirmed.</p>
            <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Ticket ID:</strong> ${ticketId}</p>
              ${details}
            </div>
            <p style="color: #71717a; font-size: 12px;">Please show the QR code in your app at the entrance.</p>
          </div>
        `
      })
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await response.json();
      if (!response.ok) console.warn("⚠️ API Error:", data);
      else console.log("✅ Email successfully handed off to SMTP Server.");
    } else {
      console.warn(`⚠️ Email API unavailable (Status: ${response.status}). This is normal locally.`);
    }

  } catch (err) {
    console.error("❌ Network Error (Email):", err);
  }
};

// Helper: Validation
const validateRestrictions = (eventData, user, studentData) => {
  if (eventData.isUniversityOnly && !user.email.toLowerCase().endsWith('@chitkara.edu.in')) {
    throw new Error("🚫 Restricted: Official @chitkara.edu.in email required.");
  }
};

// 1. INDIVIDUAL REGISTRATION
export const registerForEvent = async (eventId, user, profile, answers = {}) => {
  if (!user) throw new Error("User must be logged in");
  
  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const statsRef = doc(db, "system_stats", "daily_emails");
  
  let eventDataForEmail = {}; 

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const existingReg = await transaction.get(registrationRef);
      const statsSnap = await transaction.get(statsRef);

      if (!eventDoc.exists()) throw new Error("Event not found");
      eventDataForEmail = eventDoc.data();

      validateRestrictions(eventDataForEmail, user, profile);

      if ((eventDataForEmail.ticketsSold || 0) >= parseInt(eventDataForEmail.totalTickets)) {
        throw new Error("SOLD_OUT");
      }
      if (existingReg.exists()) {
        throw new Error("ALREADY_BOOKED");
      }

      const newTicket = {
        eventId,
        eventTitle: eventDataForEmail.title,
        eventDate: eventDataForEmail.date,
        eventTime: eventDataForEmail.time || 'TBA',
        eventLocation: eventDataForEmail.location,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        userRollNo: profile?.rollNo || 'N/A',
        userPhone: profile?.phone || 'N/A',
        answers: answers,
        type: 'individual',
        status: 'confirmed',
        createdAt: serverTimestamp(),
        used: false
      };

      transaction.set(registrationRef, newTicket);
      transaction.update(eventRef, { ticketsSold: (eventDataForEmail.ticketsSold || 0) + 1 });
      
      if (statsSnap.exists()) {
        transaction.update(statsRef, { count: (statsSnap.data().count || 0) + 1 });
      } else {
        transaction.set(statsRef, { count: 1 });
      }
    });

    // TRIGGER EMAIL
    sendConfirmationEmail(
      user.email,
      user.displayName,
      eventDataForEmail.title,
      `${eventId}_${user.uid}`,
      `<p><strong>Date:</strong> ${eventDataForEmail.date}</p><p><strong>Location:</strong> ${eventDataForEmail.location}</p>`
    );

    return { success: true };

  } catch (error) {
    console.error("Registration Error:", error);
    throw error;
  }
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

      if ((eventDataForEmail.ticketsSold || 0) >= parseInt(eventDataForEmail.totalTickets)) throw new Error("Sold Out");
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

    sendConfirmationEmail(
      user.email,
      user.displayName,
      eventDataForEmail.title,
      `${eventId}_${user.uid}`,
      `<p><strong>Team:</strong> ${teamName}</p><p><strong>Code:</strong> ${teamCode}</p>`
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

    sendConfirmationEmail(
      user.email,
      user.displayName,
      eventDataForEmail.title,
      `${eventId}_${user.uid}`,
      `<p>Joined Team: <strong>${teamName}</strong></p>`
    );

    return { success: true };
  } catch (error) { throw error; }
};
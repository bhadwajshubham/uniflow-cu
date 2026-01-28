import { db } from '../../../lib/firebase';
import { doc, runTransaction, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * 📧 PROFESSIONAL EMAIL SENDER
 * Includes: QR Code Image & Deep Link Button
 */
const sendConfirmationEmail = async (userEmail, userName, eventTitle, ticketId, details) => {
  // 1. LOCALHOST GUARD
  if (window.location.hostname === 'localhost' && window.location.port === '5173') {
    console.log("🛑 Localhost: Email skipped (Mock Mode).");
    return;
  }

  console.log(`📨 Sending professional email to ${userEmail}...`);
  
  // 2. GENERATE ASSETS
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketId}`;
  const appUrl = window.location.origin; 
  const ticketLink = `${appUrl}/tickets`;

  try {
    const response = await fetch('/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: userEmail,
        email: userEmail,
        subject: `🎟️ Ticket Confirmed: ${eventTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 20px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background-color: #4f46e5; padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">UniFlow Events</h1>
              </div>
              <div style="padding: 30px 20px; text-align: center;">
                <h2 style="color: #18181b; margin-top: 0;">You're going to ${eventTitle}! 🚀</h2>
                <p style="color: #52525b; font-size: 16px; line-height: 1.5;">
                  Hi <strong>${userName}</strong>, your spot is confirmed. <br/>
                  Simply scan this QR code at the entrance.
                </p>
                <div style="margin: 25px 0;">
                  <img src="${qrCodeUrl}" alt="Ticket QR Code" style="width: 180px; height: 180px; border: 2px solid #e4e4e7; border-radius: 12px; padding: 10px;" />
                  <p style="color: #71717a; font-size: 14px; margin-top: 5px; font-family: monospace;">ID: ${ticketId}</p>
                </div>
                <div style="background-color: #f4f4f5; border-radius: 8px; padding: 15px; text-align: left; margin-bottom: 25px;">
                  ${details}
                </div>
                <a href="${ticketLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  View Ticket in App
                </a>
              </div>
              <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                  Need help? Contact support via the UniFlow App.<br/>
                  &copy; ${new Date().getFullYear()} UniFlow. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      })
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await response.json();
      if (!response.ok) console.warn("⚠️ Email API Warning:", data);
      else console.log("✅ Professional Email Sent!");
    }
  } catch (err) {
    console.error("❌ Email Error:", err);
  }
};

// Validation Helper
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

    await sendConfirmationEmail(
      user.email,
      user.displayName,
      eventDataForEmail.title,
      `${eventId}_${user.uid}`,
      `<p style="margin: 5px 0;"><strong>📅 Date:</strong> ${eventDataForEmail.date}</p>
       <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${eventDataForEmail.location}</p>`
    );

    return { success: true };

  } catch (error) {
    console.error("Registration Error:", error);
    throw error;
  }
};

// 2. CREATE TEAM
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

    await sendConfirmationEmail(
      user.email,
      user.displayName,
      "Team Event", 
      `${eventId}_${user.uid}`,
      `<p><strong>Team:</strong> ${teamName}</p><p><strong>Code:</strong> ${teamCode}</p>`
    );

    return { success: true, teamCode };
  } catch (error) { throw error; }
};

// 3. JOIN TEAM
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

  try {
    const leaderSnap = await getDocs(q);
    if (leaderSnap.empty) throw new Error("Invalid Team Code");
    const leaderRef = leaderSnap.docs[0].ref;
    let teamName = "";

    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const existingReg = await transaction.get(registrationRef);
      const leaderDoc = await transaction.get(leaderRef);

      if (!leaderDoc.exists()) throw new Error("Team Disbanded");
      const leaderData = leaderDoc.data();
      teamName = leaderData.teamName;
      if (leaderData.teamSize >= leaderData.maxTeamSize) throw new Error("Team Full");

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
      });

      transaction.update(leaderRef, { teamSize: leaderData.teamSize + 1 });
      transaction.update(eventRef, { ticketsSold: (eventData.ticketsSold || 0) + 1 });
    });

    await sendConfirmationEmail(
      user.email,
      user.displayName,
      "Team Event",
      `${eventId}_${user.uid}`,
      `<p>Joined Team: <strong>${teamName}</strong></p>`
    );

    return { success: true };
  } catch (error) { throw error; }
};
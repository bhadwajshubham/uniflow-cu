import { db } from '../../../lib/firebase';
import { 
  doc, 
  runTransaction, 
  serverTimestamp, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  increment,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

// ==========================================
// 🎨 1. PROFESSIONAL EMAIL TEMPLATE
// ==========================================
const getTicketEmailTemplate = (userName, eventName, eventDate, venue, ticketId) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e4e4e7; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .content { padding: 30px; color: #333; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #18181b; }
        .card { background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 25px; margin: 20px 0; }
        .row { margin-bottom: 15px; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
        .row:last-child { border-bottom: none; margin-bottom: 0; }
        .label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; }
        .value { font-size: 16px; font-weight: 600; color: #0f172a; text-align: right; }
        .btn { display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; margin-top: 10px; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>UniFlow Ticket</h1>
          <p>Your Gate Pass is Ready!</p>
        </div>
        <div class="content">
          <p class="greeting">Hi ${userName},</p>
          <p>Your registration for <strong>${eventName}</strong> is confirmed!</p>
          <div class="card">
            <div class="row"><span class="label">Event</span><span class="value">${eventName}</span></div>
            <div class="row"><span class="label">Date</span><span class="value">${new Date(eventDate).toLocaleDateString()}</span></div>
            <div class="row"><span class="label">Venue</span><span class="value">${venue || 'TBA'}</span></div>
            <div class="row"><span class="label">Ticket ID</span><span class="value" style="font-family: monospace; color: #4f46e5;">${ticketId}</span></div>
          </div>
          <div style="text-align: center;">
            <a href="https://uniflow-cu.vercel.app/my-tickets" class="btn">View Digital Ticket</a>
          </div>
        </div>
        <div class="footer"><p>© 2026 UniFlow Event Management</p></div>
      </div>
    </body>
    </html>
  `;
};

// ==========================================
// 🚀 2. INDIVIDUAL REGISTRATION
// ==========================================

export const registerForEvent = async (eventId, user, profile) => {
  if (!user || !profile) throw new Error("User profile incomplete");
  if (!profile.termsAccepted) throw new Error("Terms not accepted");

  const eventRef = doc(db, 'events', eventId);
  const userRef = doc(db, 'users', user.uid);
  const ticketRef = doc(db, 'tickets', `${eventId}_${user.uid}`);

  try {
    let ticketData;

    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) throw new Error("Event not found");

      const eventData = eventDoc.data();
      if (eventData.registered >= eventData.totalTickets) throw new Error("Event is Housefull!");

      const ticketDoc = await transaction.get(ticketRef);
      if (ticketDoc.exists()) throw new Error("You are already registered!");

      ticketData = {
        eventId,
        userId: user.uid,
        userEmail: user.email,
        userName: profile.displayName || user.displayName || 'Student',
        userRollNo: profile.rollNo,
        eventName: eventData.title,
        eventDate: eventData.date,
        eventVenue: eventData.venue || eventData.location,
        status: 'confirmed',
        bookedAt: serverTimestamp(),
        scanned: false,
        qrCode: `${eventId}_${user.uid}`
      };

      transaction.set(ticketRef, ticketData);
      transaction.update(eventRef, { registered: increment(1), participants: arrayUnion(user.uid) });
      transaction.update(userRef, { registeredEvents: arrayUnion(eventId) });
    });

    // 📧 SEND EMAIL
    try {
        const emailHtml = getTicketEmailTemplate(ticketData.userName, ticketData.eventName, ticketData.eventDate, ticketData.eventVenue, ticketRef.id);
        await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: user.email, subject: `🎟️ Ticket: ${ticketData.eventName}`, html: emailHtml })
        });
    } catch (e) { console.error("Email failed", e); }

    return true;
  } catch (error) { console.error("Registration Failed:", error); throw error; }
};

// ==========================================
// 👥 3. TEAM REGISTRATION (CREATE)
// ==========================================

export const registerTeam = async (eventId, user, teamName, profile) => {
  if (!teamName) throw new Error("Team Name required");
  
  const eventRef = doc(db, 'events', eventId);
  const teamId = `${eventId}_team_${Date.now()}`; 
  const teamRef = doc(db, 'teams', teamId);
  const ticketRef = doc(db, 'tickets', `${eventId}_${user.uid}`);

  try {
    let ticketData;
    await runTransaction(db, async (transaction) => {
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists()) throw new Error("Event not found");
        
        const eventData = eventDoc.data();
        if (eventData.registered >= eventData.totalTickets) throw new Error("Event Full");

        // Create Team
        const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        transaction.set(teamRef, {
            eventId,
            teamName,
            leaderId: user.uid,
            members: [user.uid],
            teamCode: teamCode,
            createdAt: serverTimestamp()
        });

        // Create Ticket
        ticketData = {
            eventId,
            userId: user.uid,
            teamId,
            teamName,
            role: 'LEADER',
            userName: profile.displayName || user.displayName,
            userRollNo: profile.rollNo,
            eventName: eventData.title,
            eventDate: eventData.date,
            status: 'confirmed',
            bookedAt: serverTimestamp(),
            scanned: false
        };

        transaction.set(ticketRef, ticketData);
        transaction.update(eventRef, { registered: increment(1), participants: arrayUnion(user.uid) });
    });
    
    // Email for Leader
    try {
        const emailHtml = getTicketEmailTemplate(ticketData.userName, ticketData.eventName, ticketData.eventDate, ticketData.eventVenue || 'TBA', ticketRef.id);
        await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: user.email, subject: `🎟️ Team Leader Ticket: ${ticketData.eventName}`, html: emailHtml })
        });
    } catch (e) { console.error("Email failed", e); }

    return true;
  } catch (error) { console.error(error); throw error; }
};

// ==========================================
// 🤝 4. JOIN TEAM (RESTORED ✅)
// ==========================================

export const joinTeam = async (eventId, user, teamCode, profile) => {
  if (!teamCode) throw new Error("Team Code required");

  // 1. Find Team by Code
  const teamsRef = collection(db, 'teams');
  const q = query(teamsRef, where('teamCode', '==', teamCode.toUpperCase().trim()), where('eventId', '==', eventId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Invalid Team Code for this event");
  }

  const teamDoc = querySnapshot.docs[0];
  const teamData = teamDoc.data();
  const teamId = teamDoc.id;

  const eventRef = doc(db, 'events', eventId);
  const teamRefDoc = doc(db, 'teams', teamId);
  const userRef = doc(db, 'users', user.uid);
  const ticketRef = doc(db, 'tickets', `${eventId}_${user.uid}`);

  try {
    let ticketData;

    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) throw new Error("Event not found");
      const eventData = eventDoc.data();

      // Check Limits
      if (eventData.registered >= eventData.totalTickets) throw new Error("Event Full");
      if (teamData.members.length >= eventData.maxTeamSize) throw new Error("Team is Full");
      if (teamData.members.includes(user.uid)) throw new Error("Already in this team");

      // Check Existing Ticket
      const existingTicket = await transaction.get(ticketRef);
      if (existingTicket.exists()) throw new Error("You already have a ticket");

      // Prepare Ticket
      ticketData = {
        eventId,
        userId: user.uid,
        teamId,
        teamName: teamData.teamName,
        role: 'MEMBER',
        userName: profile.displayName || user.displayName,
        userRollNo: profile.rollNo,
        eventName: eventData.title,
        eventDate: eventData.date,
        eventVenue: eventData.venue || eventData.location,
        status: 'confirmed',
        bookedAt: serverTimestamp(),
        scanned: false
      };

      // Updates
      transaction.set(ticketRef, ticketData);
      transaction.update(teamRefDoc, { members: arrayUnion(user.uid) });
      transaction.update(eventRef, { registered: increment(1), participants: arrayUnion(user.uid) });
      transaction.update(userRef, { registeredEvents: arrayUnion(eventId) });
    });

    // 📧 SEND EMAIL TO MEMBER
    try {
        const emailHtml = getTicketEmailTemplate(ticketData.userName, ticketData.eventName, ticketData.eventDate, ticketData.eventVenue, ticketRef.id);
        await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: user.email, subject: `🎟️ Team Ticket: ${ticketData.eventName}`, html: emailHtml })
        });
    } catch (e) { console.error("Email failed", e); }

    return true;

  } catch (error) {
    console.error("Join Team Failed:", error);
    throw error;
  }
};
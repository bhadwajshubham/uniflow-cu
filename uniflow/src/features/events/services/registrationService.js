import { db } from '../../../lib/firebase';
import { 
  doc, 
  runTransaction, 
  serverTimestamp, 
  increment, 
  arrayUnion,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

// ==========================================
// 🎨 1. EMAIL TEMPLATE (UPDATED)
// ==========================================
const getTicketEmailTemplate = (userName, eventName, eventDate, venue, ticketId) => {
  // ✅ FIX 1: Reliable QR Code (Gmail friendly)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketId}`;
  
  // ✅ FIX 2: Dynamic Link to Specific Ticket
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://uniflow-cu.vercel.app';
  const ticketLink = `${appUrl}/tickets/${ticketId}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; background-color: #f4f4f5; padding: 20px; }
        .container { max-width: 600px; margin: auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center; color: white; }
        .content { padding: 30px; }
        .card { background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 20px; }
        .ticket-id { font-family: monospace; color: #4f46e5; word-break: break-all; }
        .btn { display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #71717a; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Ticket Confirmed!</h1><p>See you there, ${userName.split(' ')[0]}! 👋</p></div>
        <div class="content">
          <p>Registration for <strong>${eventName}</strong> is successful.</p>
          <div class="card">
            <p><strong>📅 Date:</strong> ${eventDate}</p>
            <p><strong>📍 Venue:</strong> ${venue}</p>
            <p><strong>🎫 ID:</strong> <span class="ticket-id">${ticketId}</span></p>
          </div>
          <div style="text-align:center; margin-top: 20px;">
            <img src="${qrUrl}" alt="Ticket QR" style="border: 4px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" width="150" />
          </div>
          <div style="text-align:center;">
            <a href="${ticketLink}" class="btn">View Full Ticket</a>
          </div>
          <div class="footer">
            <p>Show this QR code at the entrance.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ==========================================
// 🚀 2. INDIVIDUAL REGISTRATION (FIXED)
// ==========================================
export const registerForEvent = async (eventId, user, profile) => {
  if (!user || !profile) throw new Error("User profile incomplete");

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

      // 🔥 FIX 3: ADD SEMESTER
      const safeUserName = profile.name || profile.userName || user.displayName || 'Student';
      const safeRollNo = profile.rollNo ? profile.rollNo.toUpperCase() : 'N/A';
      const safePhone = profile.phoneNumber || profile.phone || 'N/A';
      const safeBranch = profile.branch ? profile.branch.toUpperCase() : 'N/A';
      const safeSemester = profile.semester ? profile.semester.toString() : 'N/A'; // ✅ Saved
      const safeGroup = profile.group ? profile.group.toUpperCase() : 'N/A';
      const safeResidency = profile.residency || 'N/A';

      ticketData = {
        eventId,
        userId: user.uid,
        userEmail: user.email || '',
        userName: safeUserName,
        userRollNo: safeRollNo,
        userPhone: safePhone,
        userBranch: safeBranch,
        userSemester: safeSemester, // ✅ Included in Ticket
        userGroup: safeGroup,
        userResidency: safeResidency,
        customAnswers: profile.customAnswers || {},
        eventName: eventData.title || 'Event',
        eventDate: eventData.date || '',
        eventVenue: eventData.venue || eventData.location || 'TBA',
        status: 'confirmed',
        bookedAt: serverTimestamp(),
        scanned: false,
        qrCode: `${eventId}_${user.uid}`
      };

      transaction.set(ticketRef, ticketData);
      transaction.update(eventRef, { 
        registered: increment(1), 
        participants: arrayUnion(user.uid) 
      });
      transaction.update(userRef, { 
        registeredEvents: arrayUnion(eventId) 
      });
    });

    // 📧 SEND EMAIL
    try {
        const emailHtml = getTicketEmailTemplate(ticketData.userName, ticketData.eventName, ticketData.eventDate, ticketData.eventVenue, ticketRef.id);
        
        // ✅ FIX 4: Ensure endpoint matches backend file name (Assuming 'send-email.js')
        await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                to: user.email, 
                subject: `🎟️ Ticket: ${ticketData.eventName}`, 
                html: emailHtml 
            })
        });
    } catch (e) { console.error("Email failed", e); }

    return true;
  } catch (error) { 
    console.error("Registration Failed:", error); 
    throw error; 
  }
};

// ==========================================
// 👥 3. TEAM REGISTRATION (FIXED)
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

        const safeUserName = profile.name || user.displayName || 'Leader';
        const safeRollNo = profile.rollNo ? profile.rollNo.toUpperCase() : 'N/A';
        const safeSemester = profile.semester ? profile.semester.toString() : 'N/A'; // ✅ Saved

        const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        transaction.set(teamRef, {
            eventId,
            teamName,
            leaderId: user.uid,
            members: [user.uid],
            teamCode: teamCode,
            createdAt: serverTimestamp()
        });

        ticketData = {
            eventId,
            userId: user.uid,
            teamId,
            teamName,
            role: 'LEADER',
            userName: safeUserName,
            userRollNo: safeRollNo,
            userSemester: safeSemester, // ✅ Saved
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
    });
    
    // Email for Leader
    try {
        const emailHtml = getTicketEmailTemplate(ticketData.userName, ticketData.eventName, ticketData.eventDate, ticketData.eventVenue || 'TBA', ticketRef.id);
        await fetch('/api/send-email', { // ✅ Fixed Endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: user.email, subject: `🎟️ Team Leader Ticket: ${ticketData.eventName}`, html: emailHtml })
        });
    } catch (e) { console.error("Email failed", e); }

    return true;
  } catch (error) { console.error(error); throw error; }
};

// ==========================================
// 🤝 4. JOIN TEAM (FIXED)
// ==========================================
export const joinTeam = async (eventId, user, teamCode, profile) => {
  if (!teamCode) throw new Error("Team Code required");

  const teamsRef = collection(db, 'teams');
  const q = query(teamsRef, where('teamCode', '==', teamCode.toUpperCase().trim()), where('eventId', '==', eventId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) throw new Error("Invalid Team Code");

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

      if (eventData.registered >= eventData.totalTickets) throw new Error("Event Full");
      if (teamData.members.length >= (eventData.teamSize || 5)) throw new Error("Team is Full");
      if (teamData.members.includes(user.uid)) throw new Error("Already in this team");

      const existingTicket = await transaction.get(ticketRef);
      if (existingTicket.exists()) throw new Error("You already have a ticket");

      const safeUserName = profile.name || user.displayName || 'Member';
      const safeRollNo = profile.rollNo ? profile.rollNo.toUpperCase() : 'N/A';
      const safeSemester = profile.semester ? profile.semester.toString() : 'N/A'; // ✅ Saved

      ticketData = {
        eventId,
        userId: user.uid,
        teamId,
        teamName: teamData.teamName,
        role: 'MEMBER',
        userName: safeUserName,
        userRollNo: safeRollNo,
        userSemester: safeSemester, // ✅ Saved
        eventName: eventData.title,
        eventDate: eventData.date,
        eventVenue: eventData.venue || eventData.location,
        status: 'confirmed',
        bookedAt: serverTimestamp(),
        scanned: false,
        qrCode: `${eventId}_${user.uid}`
      };

      transaction.set(ticketRef, ticketData);
      transaction.update(teamRefDoc, { members: arrayUnion(user.uid) });
      transaction.update(eventRef, { registered: increment(1), participants: arrayUnion(user.uid) });
      transaction.update(userRef, { registeredEvents: arrayUnion(eventId) });
    });

    try {
        const emailHtml = getTicketEmailTemplate(ticketData.userName, ticketData.eventName, ticketData.eventDate, ticketData.eventVenue, ticketRef.id);
        await fetch('/api/send-email', { // ✅ Fixed Endpoint
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
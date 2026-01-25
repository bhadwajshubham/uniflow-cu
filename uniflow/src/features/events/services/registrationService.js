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
} from 'firebase/firestore';

/* ─────────────────────────────
   🔒 RESTRICTION VALIDATION (UX Only)
   Note: Real security is in Firestore Rules
───────────────────────────── */
const validateRestrictions = (eventData, user, studentData) => {
  // University-only events
  if (eventData.isUniversityOnly === true) {
    const email = user.email.toLowerCase();
    if (!email.endsWith('@chitkara.edu.in')) {
      throw new Error(
        '🚫 This event is restricted to @chitkara.edu.in email IDs.'
      );
    }
  }

  // Branch restriction
  if (eventData.allowedBranches === 'CSE/AI Only') {
    if (
      studentData.branch !== 'B.E. (C.S.E.)' &&
      studentData.branch !== 'B.E. (C.S.E. AI)'
    ) {
      throw new Error(
        '🚫 This event is restricted to CSE / CSE-AI students.'
      );
    }
  }
};

/* ─────────────────────────────
   📧 EMAIL (FIRE-AND-FORGET)
   Non-blocking Vercel API Call
───────────────────────────── */
const triggerEmail = async ({ email, name, ticketId, event }) => {
  try {
    // Vercel Serverless Function Call
    const res = await fetch('/api/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        name: name,
        ticketId: ticketId,
        eventName: event.title,
        eventDate: event.date,
        eventLocation: event.location,
      }),
    });

    if (!res.ok) {
      console.warn('⚠️ Email API returned an error, but ticket is secured.');
    } else {
      console.log('✅ Email sent successfully!');
    }
  } catch (err) {
    // Silent failure — System NEVER crashes if SMTP fails
    console.error('❌ Email Trigger Failed (ignored):', err.message);
  }
};

/* ─────────────────────────────
   1️⃣ INDIVIDUAL REGISTRATION
───────────────────────────── */
export const registerForEvent = async (eventId, user, studentData) => {
  if (!user) throw new Error('User must be logged in');

  const eventRef = doc(db, 'events', eventId);
  const ticketId = `${eventId}_${user.uid}`; // Deterministic ID
  const registrationRef = doc(db, 'registrations', ticketId);

  let eventSnapshotData = null;

  
  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    const regSnap = await transaction.get(registrationRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    if (regSnap.exists()) throw new Error('Already registered');

    const eventData = eventSnap.data();
    eventSnapshotData = eventData;

    validateRestrictions(eventData, user, studentData);

    if ((eventData.ticketsSold || 0) >= eventData.totalTickets) {
      throw new Error('Housefull! Event is sold out.');
    }

    // 1. Save Ticket
    transaction.set(registrationRef, {
      ticketId, // ADDED: Crucial for QR Code
      eventId,
      eventTitle: eventData.title,
      organizerName: eventData.organizerName || 'UniFlow',
      eventDate: eventData.date,
      eventLocation: eventData.location,

      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || studentData.name || '',

      rollNo: studentData.rollNo || '',
      phone: studentData.phone || '',
      branch: studentData.branch || '',

      type: 'individual',
      status: 'confirmed',
      createdAt: serverTimestamp(),
    });

    // 2. Increment Sold Count
    transaction.update(eventRef, {
      ticketsSold: (eventData.ticketsSold || 0) + 1,
    });
  });

  // 🔔 Trigger Email Async (Does not block the UI)
  triggerEmail({
    email: user.email,
    name: user.displayName || studentData.name || 'Student',
    ticketId: ticketId,
    event: eventSnapshotData,
  });

  return { success: true, ticketId }; // Returning ticketId for QR Code Screen
};

/* ─────────────────────────────
   2️⃣ CREATE TEAM
───────────────────────────── */
export const registerTeam = async (eventId, user, teamName, studentData) => {
  if (!user) throw new Error('User must be logged in');
  if (!teamName || teamName.trim().length < 3) {
    throw new Error('Team name must be at least 3 characters');
  }

  const eventRef = doc(db, 'events', eventId);
  const ticketId = `${eventId}_${user.uid}`;
  const registrationRef = doc(db, 'registrations', ticketId);

  // Secure 6-digit alphanumeric code
  const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  let eventSnapshotData = null;

  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    const regSnap = await transaction.get(registrationRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    if (regSnap.exists()) throw new Error('You are already registered');

    const eventData = eventSnap.data();
    eventSnapshotData = eventData;

    validateRestrictions(eventData, user, studentData);

    if ((eventData.ticketsSold || 0) >= eventData.totalTickets) {
      throw new Error('Event is sold out');
    }

    transaction.set(registrationRef, {
      ticketId,
      eventId,
      eventTitle: eventData.title,

      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || studentData.name || '',
      rollNo: studentData.rollNo || '',
      branch: studentData.branch || '',

      type: 'team_leader',
      teamName: teamName.trim(),
      teamCode,
      teamSize: 1,
      maxTeamSize: eventData.teamSize || 4,

      status: 'confirmed',
      createdAt: serverTimestamp(),
    });

    transaction.update(eventRef, {
      ticketsSold: (eventData.ticketsSold || 0) + 1,
    });
  });

  triggerEmail({
    email: user.email,
    name: user.displayName || studentData.name,
    ticketId: ticketId,
    event: eventSnapshotData,
  });

  return { success: true, teamCode, ticketId };
};

/* ─────────────────────────────
   3️⃣ JOIN TEAM
───────────────────────────── */
export const joinTeam = async (eventId, user, teamCode, studentData) => {
  if (!user) throw new Error('User must be logged in');
  if (!teamCode) throw new Error('Team code is required');

  const eventRef = doc(db, 'events', eventId);
  const ticketId = `${eventId}_${user.uid}`;
  const registrationRef = doc(db, 'registrations', ticketId);

  // ⚠️ First find the leader (Read-only query, safe outside transaction)
  const q = query(
    collection(db, 'registrations'),
    where('eventId', '==', eventId),
    where('teamCode', '==', teamCode.toUpperCase()),
    where('type', '==', 'team_leader'),
    limit(1)
  );

  const leaderSnap = await getDocs(q);
  if (leaderSnap.empty) throw new Error('Invalid team code');

  const leaderRef = leaderSnap.docs[0].ref;
  let eventSnapshotData = null;

  await runTransaction(db, async (transaction) => {
    // Get fresh data inside the lock
    const eventSnap = await transaction.get(eventRef);
    const regSnap = await transaction.get(registrationRef);
    const leaderDoc = await transaction.get(leaderRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    if (regSnap.exists()) throw new Error('You are already registered');

    const leaderData = leaderDoc.data();
    if (leaderData.teamSize >= leaderData.maxTeamSize) {
      throw new Error('Team is already full');
    }

    const eventData = eventSnap.data();
    eventSnapshotData = eventData;

    validateRestrictions(eventData, user, studentData);

    // 1. Add Member Registration
    transaction.set(registrationRef, {
      ticketId,
      eventId,
      eventTitle: eventData.title,

      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || studentData.name || '',
      rollNo: studentData.rollNo || '',
      branch: studentData.branch || '',

      type: 'team_member',
      teamName: leaderData.teamName,
      teamCode: leaderData.teamCode,

      status: 'confirmed',
      createdAt: serverTimestamp(),
    });

    // 2. Increment Team Size
    transaction.update(leaderRef, {
      teamSize: leaderData.teamSize + 1,
    });

    // 3. Increment Total Event Tickets
    transaction.update(eventRef, {
      ticketsSold: (eventData.ticketsSold || 0) + 1,
    });
  });

  triggerEmail({
    email: user.email,
    name: user.displayName || studentData.name,
    ticketId: ticketId,
    event: eventSnapshotData,
  });

  return { success: true, ticketId };
};
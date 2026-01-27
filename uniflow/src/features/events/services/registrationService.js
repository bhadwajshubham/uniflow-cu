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
   🔒 RESTRICTION VALIDATION (UX ONLY)
   Real security = Firestore Rules
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
   📧 EMAIL (FIRE & FORGET)
   ZERO impact on registration
───────────────────────────── */
const triggerEmail = async (email, event) => {
  try {
    await fetch('/api/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        eventTitle: event.title,
        date: event.date,
        time: event.time || '',
        location: event.location,
      }),
    });
  } catch (err) {
    // SILENT FAIL — NEVER BLOCK REGISTRATION
    console.warn('Email failed (ignored):', err.message);
  }
};

/* ─────────────────────────────
   1️⃣ INDIVIDUAL REGISTRATION
───────────────────────────── */
export const registerForEvent = async (eventId, user, studentData) => {
  if (!user) throw new Error('User must be logged in');

  const eventRef = doc(db, 'events', eventId);
  const ticketId = `${eventId}_${user.uid}`;
  const registrationRef = doc(db, 'registrations', ticketId);

  let eventSnapshot = null;

  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    const regSnap = await transaction.get(registrationRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    if (regSnap.exists()) throw new Error('Already registered');

    const eventData = eventSnap.data();
    eventSnapshot = eventData;

    validateRestrictions(eventData, user, studentData);

    if ((eventData.ticketsSold || 0) >= eventData.totalTickets) {
      throw new Error('Housefull! Event is sold out.');
    }

    transaction.set(registrationRef, {
      ticketId,
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

    transaction.update(eventRef, {
      ticketsSold: (eventData.ticketsSold || 0) + 1,
    });
  });

  // 🔔 async email (non-blocking)
  triggerEmail(user.email, eventSnapshot);

  return { success: true, ticketId };
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
  const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  let eventSnapshot = null;

  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    const regSnap = await transaction.get(registrationRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    if (regSnap.exists()) throw new Error('Already registered');

    const eventData = eventSnap.data();
    eventSnapshot = eventData;

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

  triggerEmail(user.email, eventSnapshot);

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
  let eventSnapshot = null;

  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    const regSnap = await transaction.get(registrationRef);
    const leaderDoc = await transaction.get(leaderRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    if (regSnap.exists()) throw new Error('Already registered');

    const leaderData = leaderDoc.data();
    if (leaderData.teamSize >= leaderData.maxTeamSize) {
      throw new Error('Team is already full');
    }

    const eventData = eventSnap.data();
    eventSnapshot = eventData;

    validateRestrictions(eventData, user, studentData);

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

    transaction.update(leaderRef, {
      teamSize: leaderData.teamSize + 1,
    });

    transaction.update(eventRef, {
      ticketsSold: (eventData.ticketsSold || 0) + 1,
    });
  });

  triggerEmail(user.email, eventSnapshot);

  return { success: true, ticketId };
};

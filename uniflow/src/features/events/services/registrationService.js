import { db } from '../../../lib/firebase';
import {
  doc,
  runTransaction,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit
} from 'firebase/firestore';

/* ─────────────────────────────
   🔒 VALIDATION HELPERS
───────────────────────────── */
const validateRestrictions = (eventData, user, studentData) => {
  if (eventData.isUniversityOnly) {
    const email = user.email.toLowerCase();
    if (!email.endsWith('@chitkara.edu.in')) {
      throw new Error('Restricted: University email required');
    }
  }

  if (eventData.allowedBranches === 'CSE/AI Only') {
    if (
      studentData.branch !== 'B.E. (C.S.E.)' &&
      studentData.branch !== 'B.E. (C.S.E. AI)'
    ) {
      throw new Error('Restricted: Only CSE / CSE-AI allowed');
    }
  }
};

/* ─────────────────────────────
   📧 STEP-4 EMAIL TRIGGER
   (Fire & Forget – NO AUTH, NO SDK)
───────────────────────────── */
const triggerEmail = async ({ to, subject, html }) => {
  try {
    await fetch('/api/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html })
    });
  } catch (err) {
    // ❗ Email failure should NEVER break registration
    console.warn('Email failed silently');
  }
};

/* ─────────────────────────────
   1️⃣ INDIVIDUAL REGISTRATION
───────────────────────────── */
export const registerForEvent = async (eventId, user, studentData) => {
  if (!user) throw new Error('Login required');

  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);

  let eventData;

  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    const regSnap = await transaction.get(registrationRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    if (regSnap.exists()) throw new Error('Already registered');

    eventData = eventSnap.data();
    validateRestrictions(eventData, user, studentData);

    if ((eventData.ticketsSold || 0) >= eventData.totalTickets) {
      throw new Error('Sold out');
    }

    transaction.set(registrationRef, {
      eventId,
      eventTitle: eventData.title,
      eventDate: eventData.date,
      eventTime: eventData.time,
      eventLocation: eventData.location,

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

    transaction.update(eventRef, {
      ticketsSold: (eventData.ticketsSold || 0) + 1,
    });
  });

  /* 🔔 STEP-4 EMAIL (AFTER SUCCESS) */
  triggerEmail({
    to: user.email,
    subject: `🎟️ Registration Confirmed – ${eventData.title}`,
    html: `
      <h2>Registration Successful</h2>
      <p><b>Event:</b> ${eventData.title}</p>
      <p><b>Date:</b> ${eventData.date} ${eventData.time}</p>
      <p><b>Location:</b> ${eventData.location}</p>
      <p>Please show your ticket in the UniFlow app at entry.</p>
    `
  });

  return { success: true };
};

/* ─────────────────────────────
   2️⃣ CREATE TEAM
───────────────────────────── */
export const registerTeam = async (eventId, user, teamName, studentData) => {
  if (!user) throw new Error('Login required');
  if (!teamName || teamName.length < 3) throw new Error('Invalid team name');

  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  let eventData;

  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    const regSnap = await transaction.get(registrationRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    if (regSnap.exists()) throw new Error('Already registered');

    eventData = eventSnap.data();
    validateRestrictions(eventData, user, studentData);

    transaction.set(registrationRef, {
      eventId,
      eventTitle: eventData.title,

      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,

      teamName: teamName.trim(),
      teamCode,
      teamSize: 1,
      maxTeamSize: eventData.teamSize || 4,

      type: 'team_leader',
      status: 'confirmed',
      createdAt: serverTimestamp(),
    });

    transaction.update(eventRef, {
      ticketsSold: (eventData.ticketsSold || 0) + 1,
    });
  });

  triggerEmail({
    to: user.email,
    subject: `🎟️ Team Registered – ${eventData.title}`,
    html: `
      <h2>Team Registration Successful</h2>
      <p><b>Event:</b> ${eventData.title}</p>
      <p><b>Team Code:</b> ${teamCode}</p>
      <p>Share this code with your teammates.</p>
    `
  });

  return { success: true, teamCode };
};

/* ─────────────────────────────
   3️⃣ JOIN TEAM
───────────────────────────── */
export const joinTeam = async (eventId, user, teamCode, studentData) => {
  if (!user) throw new Error('Login required');

  const eventRef = doc(db, 'events', eventId);
  const registrationRef = doc(db, 'registrations', `${eventId}_${user.uid}`);

  const q = query(
    collection(db, 'registrations'),
    where('eventId', '==', eventId),
    where('teamCode', '==', teamCode),
    where('type', '==', 'team_leader'),
    limit(1)
  );

  const leaderSnap = await getDocs(q);
  if (leaderSnap.empty) throw new Error('Invalid team code');

  const leaderRef = leaderSnap.docs[0].ref;

  let eventData;

  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    const leaderDoc = await transaction.get(leaderRef);
    const regSnap = await transaction.get(registrationRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    if (regSnap.exists()) throw new Error('Already registered');

    const leaderData = leaderDoc.data();
    if (leaderData.teamSize >= leaderData.maxTeamSize) {
      throw new Error('Team full');
    }

    eventData = eventSnap.data();
    validateRestrictions(eventData, user, studentData);

    transaction.set(registrationRef, {
      eventId,
      eventTitle: eventData.title,

      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,

      teamName: leaderData.teamName,
      teamCode: leaderData.teamCode,

      type: 'team_member',
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

  triggerEmail({
    to: user.email,
    subject: `🎟️ Joined Team – ${eventData.title}`,
    html: `
      <h2>Team Joined Successfully</h2>
      <p><b>Event:</b> ${eventData.title}</p>
      <p><b>Team:</b> ${teamCode}</p>
    `
  });

  return { success: true };
};

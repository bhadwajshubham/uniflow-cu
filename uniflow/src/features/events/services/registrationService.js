import { db } from '../../../lib/firebase';
import {
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

/* ─────────────────────────────
   📧 EMAIL TRIGGER (BEST EFFORT)
   ─ does NOT affect registration
───────────────────────────── */
const sendConfirmationEmail = async ({ userEmail, event }) => {
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: userEmail,
        subject: `🎟️ Ticket Confirmed: ${event.title}`,
        html: `
          <div style="font-family:Arial,sans-serif">
            <h2>Registration Confirmed</h2>
            <p>You are registered for:</p>
            <p><b>${event.title}</b></p>
            <p>Date: ${event.date} ${event.time || ''}</p>
            <p>Location: ${event.location}</p>
            <br/>
            <small>UniFlow Events</small>
          </div>
        `,
      }),
    });
  } catch (err) {
    // ❗ Never block user for email failure
    console.error('Email failed (ignored):', err);
  }
};

/* ─────────────────────────────
   🎟️ INDIVIDUAL REGISTRATION
───────────────────────────── */
export const registerForEvent = async (eventId, user, studentData) => {
  if (!user) throw new Error('User must be logged in');

  const eventRef = doc(db, 'events', eventId);
  const regRef = doc(db, 'registrations', `${eventId}_${user.uid}`);

  let eventSnapshotData = null;

  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    const regSnap = await transaction.get(regRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    if (regSnap.exists()) throw new Error('Already registered');

    const eventData = eventSnap.data();
    eventSnapshotData = eventData;

    if ((eventData.ticketsSold || 0) >= eventData.totalTickets) {
      throw new Error('Sold out');
    }

    transaction.set(regRef, {
      eventId,
      eventTitle: eventData.title,
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,
      branch: studentData.branch,
      rollNo: studentData.rollNo,
      status: 'confirmed',
      createdAt: serverTimestamp(),
    });

    transaction.update(eventRef, {
      ticketsSold: (eventData.ticketsSold || 0) + 1,
    });
  });

  // 📧 EMAIL (AFTER SUCCESS)
  await sendConfirmationEmail({
    userEmail: user.email,
    event: eventSnapshotData,
  });

  return { success: true };
};

/* ─────────────────────────────
   👥 TEAM LEADER REGISTRATION
───────────────────────────── */
export const registerTeam = async (eventId, user, teamName, studentData) => {
  if (!user) throw new Error('User must be logged in');

  const eventRef = doc(db, 'events', eventId);
  const regRef = doc(db, 'registrations', `${eventId}_${user.uid}`);
  const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  let eventSnapshotData = null;

  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    const regSnap = await transaction.get(regRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    if (regSnap.exists()) throw new Error('Already registered');

    const eventData = eventSnap.data();
    eventSnapshotData = eventData;

    transaction.set(regRef, {
      eventId,
      eventTitle: eventData.title,
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,
      teamName,
      teamCode,
      teamSize: 1,
      status: 'confirmed',
      createdAt: serverTimestamp(),
    });

    transaction.update(eventRef, {
      ticketsSold: (eventData.ticketsSold || 0) + 1,
    });
  });

  // 📧 EMAIL
  await sendConfirmationEmail({
    userEmail: user.email,
    event: eventSnapshotData,
  });

  return { success: true, teamCode };
};

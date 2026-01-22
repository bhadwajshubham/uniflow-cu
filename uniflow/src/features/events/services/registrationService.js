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
import { getAuth } from 'firebase/auth';

/* ─────────────────────────────
   🔒 VALIDATION HELPERS
───────────────────────────── */
const validateRestrictions = (eventData, user, studentData) => {
  if (eventData.isUniversityOnly) {
    const email = user.email.toLowerCase();
    if (!email.endsWith('@chitkara.edu.in')) {
      throw new Error(
        '🚫 Restricted: This event requires a @chitkara.edu.in email.'
      );
    }
  }

  if (eventData.allowedBranches === 'CSE/AI Only') {
    if (
      studentData.branch !== 'B.E. (C.S.E.)' &&
      studentData.branch !== 'B.E. (C.S.E. AI)'
    ) {
      throw new Error(
        '🚫 Restricted: Only CSE / CSE-AI students allowed.'
      );
    }
  }
};

/* ─────────────────────────────
   📧 EMAIL TRIGGER (CLIENT)
───────────────────────────── */
const triggerEmail = async (eventId, registrationId) => {
  try {
    const auth = getAuth();
    const token = await auth.currentUser.getIdToken();

    await fetch('/api/sendEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        eventId,
        registrationId,
      }),
    });
  } catch (err) {
    // ❗ Email failure should NOT break registration
    console.error('Email trigger failed:', err);
  }
};

/* ─────────────────────────────
   1️⃣ INDIVIDUAL REGISTRATION
───────────────────────────── */
export const registerForEvent = async (eventId, user, studentData) => {
  if (!user) throw new Error('User must be logged in');

  const eventRef = doc(db, 'events', eventId);
  const registrationId = `${eventId}_${user.uid}`;
  const registrationRef = doc(db, 'registrations', registrationId);

  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    const regSnap = await transaction.get(registrationRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    if (regSnap.exists()) throw new Error('Already registered');

    const eventData = eventSnap.data();
    validateRestrictions(eventData, user, studentData);

    if ((eventData.ticketsSold || 0) >= eventData.totalTickets) {
      throw new Error('Sold Out');
    }

    transaction.set(registrationRef, {
      eventId,
      eventTitle: eventData.title,
      organizerName: eventData.organizerName || 'UniFlow',
      eventDate: eventData.date,
      eventTime: eventData.time,
      eventLocation: eventData.location,

      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,

      rollNo: studentData.rollNo,
      phone: studentData.phone,
      residency: studentData.residency,
      group: studentData.group,
      branch: studentData.branch,
      showPublicly: studentData.showPublicly,

      type: 'individual',
      status: 'confirmed',
      createdAt: serverTimestamp(),
    });

    transaction.update(eventRef, {
      ticketsSold: (eventData.ticketsSold || 0) + 1,
    });
  });

  await triggerEmail(eventId, registrationId);
  return { success: true };
};

/* ─────────────────────────────
   2️⃣ CREATE TEAM
───────────────────────────── */
export const registerTeam = async (eventId, user, teamName, studentData) => {
  if (!user) throw new Error('User must be logged in');
  if (!teamName || teamName.trim().length < 3) {
    throw new Error('Team name too short');
  }

  const eventRef = doc(db, 'events', eventId);
  const registrationId = `${eventId}_${user.uid}`;
  const registrationRef = doc(db, 'registrations', registrationId);

  const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    const regSnap = await transaction.get(registrationRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    if (regSnap.exists()) throw new Error('Already registered');

    const eventData = eventSnap.data();
    validateRestrictions(eventData, user, studentData);

    if ((eventData.ticketsSold || 0) >= eventData.totalTickets) {
      throw new Error('Sold Out');
    }

    transaction.set(registrationRef, {
      eventId,
      eventTitle: eventData.title,
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,

      rollNo: studentData.rollNo,
      phone: studentData.phone,
      residency: studentData.residency,
      group: studentData.group,
      branch: studentData.branch,

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

  await triggerEmail(eventId, registrationId);
  return { success: true, teamCode };
};

/* ─────────────────────────────
   3️⃣ JOIN TEAM
───────────────────────────── */
export const joinTeam = async (eventId, user, teamCode, studentData) => {
  if (!user) throw new Error('User must be logged in');

  const eventRef = doc(db, 'events', eventId);
  const registrationId = `${eventId}_${user.uid}`;
  const registrationRef = doc(db, 'registrations', registrationId);

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

  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    const regSnap = await transaction.get(registrationRef);
    const leaderDoc = await transaction.get(leaderRef);

    if (!eventSnap.exists()) throw new Error('Event not found');
    if (regSnap.exists()) throw new Error('Already registered');

    const leaderData = leaderDoc.data();
    if (leaderData.teamSize >= leaderData.maxTeamSize) {
      throw new Error('Team full');
    }

    const eventData = eventSnap.data();
    validateRestrictions(eventData, user, studentData);

    transaction.set(registrationRef, {
      eventId,
      eventTitle: eventData.title,

      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,

      rollNo: studentData.rollNo,
      phone: studentData.phone,
      residency: studentData.residency,
      group: studentData.group,
      branch: studentData.branch,

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

  await triggerEmail(eventId, registrationId);
  return { success: true };
};

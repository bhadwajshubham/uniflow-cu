import admin from "firebase-admin";
import nodemailer from "nodemailer";

/* ─────────────────────────────────────────────
   🔐 Firebase Admin Init (Safe Singleton)
───────────────────────────────────────────── */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

const db = admin.firestore();

/* ─────────────────────────────────────────────
   📧 Mail Transport (Gmail SMTP)
───────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ─────────────────────────────────────────────
   🧠 HTML BUILDER (BACKEND SOURCE OF TRUTH)
───────────────────────────────────────────── */
function buildTicketEmail({ userEmail, event, registration }) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
      <h2>🎟️ Registration Confirmed</h2>
      <p>Hello <strong>${userEmail}</strong>,</p>

      <p>You have successfully registered for:</p>

      <div style="padding:16px;border:1px solid #eee;border-radius:8px">
        <h3>${event.title}</h3>
        <p><strong>Date:</strong> ${event.date} ${event.time}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Type:</strong> ${event.type}</p>
      </div>

      <p style="margin-top:16px">
        Please keep this email for entry verification.
      </p>

      <p style="margin-top:24px;font-size:12px;color:#666">
        UniFlow-cu is a technology platform. Event execution is the responsibility
        of the organizer.
      </p>
    </div>
  `;
}

/* ─────────────────────────────────────────────
   🚀 API HANDLER
───────────────────────────────────────────── */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    /* ───────── AUTH ───────── */
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    const uid = decoded.uid;
    const userEmail = decoded.email;

    if (!uid || !userEmail) {
      return res.status(401).json({ error: "Invalid token" });
    }

    /* ───────── PAYLOAD ───────── */
    const { eventId, registrationId } = req.body;

    if (!eventId || !registrationId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    /* ───────── FETCH DATA ───────── */
    const eventSnap = await db.collection("events").doc(eventId).get();
    const regSnap = await db.collection("registrations").doc(registrationId).get();

    if (!eventSnap.exists || !regSnap.exists) {
      return res.status(404).json({ error: "Event or registration not found" });
    }

    const event = eventSnap.data();
    const registration = regSnap.data();

    /* ───────── SEND EMAIL ───────── */
    const html = buildTicketEmail({ userEmail, event, registration });

    await transporter.sendMail({
      from: `"UniFlow-cu" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎟️ Ticket Confirmed: ${event.title}`,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email send failed:", err);
    return res.status(500).json({ error: "Email failed" });
  }
}

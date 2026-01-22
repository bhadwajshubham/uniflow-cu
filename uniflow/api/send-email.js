import admin from "firebase-admin";
import nodemailer from "nodemailer";

/* ───────── FIREBASE ADMIN INIT ───────── */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS)
    ),
  });
}

const db = admin.firestore();

/* ───────── MAIL TRANSPORT ───────── */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ───────── EMAIL BUILDER ───────── */
function buildTicketEmail({ userEmail, event }) {
  return `
    <div style="font-family:Arial;max-width:600px;margin:auto">
      <h2>🎟️ Registration Confirmed</h2>
      <p>Hello ${userEmail},</p>

      <h3>${event.title}</h3>
      <p><b>Date:</b> ${event.date} ${event.time}</p>
      <p><b>Location:</b> ${event.location}</p>

      <p style="margin-top:20px;font-size:12px;color:#666">
        UniFlow-cu is a platform. Event execution is organizer’s responsibility.
      </p>
    </div>
  `;
}

/* ───────── API HANDLER ───────── */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await admin.auth().verifyIdToken(token);

    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: "Missing eventId" });
    }

    const eventSnap = await db.collection("events").doc(eventId).get();
    if (!eventSnap.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    const html = buildTicketEmail({
      userEmail: decoded.email,
      event: eventSnap.data(),
    });

    await transporter.sendMail({
      from: `"UniFlow-cu" <${process.env.EMAIL_USER}>`,
      to: decoded.email,
      subject: `🎟️ Ticket Confirmed`,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("EMAIL ERROR:", err);
    return res.status(500).json({ error: "Email failed" });
  }
}

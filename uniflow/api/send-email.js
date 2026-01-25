import admin from "firebase-admin";
import nodemailer from "nodemailer";

/* Firebase Admin Init */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS)
    ),
  });
}

const db = admin.firestore();

/* Gmail SMTP */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,   // your@gmail.com
    pass: process.env.EMAIL_PASS,   // APP PASSWORD
  },
});

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

    const { eventId, registrationId } = req.body;
    if (!eventId || !registrationId) {
      return res.status(400).json({ error: "Missing payload" });
    }

    const eventSnap = await db.collection("events").doc(eventId).get();
    if (!eventSnap.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = eventSnap.data();

    await transporter.sendMail({
      from: `"UniFlow" <${process.env.EMAIL_USER}>`,
      to: decoded.email,
      subject: `🎟️ Ticket Confirmed: ${event.title}`,
      html: `
        <h2>Registration Confirmed</h2>
        <p>You are registered for <b>${event.title}</b></p>
        <p>Date: ${event.date} ${event.time}</p>
        <p>Location: ${event.location}</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("EMAIL ERROR:", err);
    return res.status(500).json({ error: "Email failed" });
  }
}

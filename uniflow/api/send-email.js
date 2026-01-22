import admin from "firebase-admin";
import nodemailer from "nodemailer";

// ─────────────────────────────────────────────
// 🔐 Firebase Admin Init (Safe Singleton)
// ─────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

const db = admin.firestore();

// ─────────────────────────────────────────────
// 📧 Mail Transport (Gmail SMTP)
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your gmail
    pass: process.env.EMAIL_PASS, // app password
  },
});

// ─────────────────────────────────────────────
// 🚀 API HANDLER
// ─────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ─────────────────────────────
    // 🔐 AUTH VERIFICATION
    // ─────────────────────────────
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

    // ─────────────────────────────
    // 📦 PAYLOAD VALIDATION
    // ─────────────────────────────
    const { eventId, subject, html } = req.body;

    if (!eventId || !subject || !html) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ─────────────────────────────
    // 🛑 RATE LIMIT (1 EMAIL / EVENT / USER)
    // ─────────────────────────────
    const throttleRef = db
      .collection("email_logs")
      .doc(`${uid}_${eventId}`);

    const existing = await throttleRef.get();
    if (existing.exists) {
      return res.status(429).json({
        error: "Email already sent for this event",
      });
    }

    // ─────────────────────────────
    // 📧 SEND EMAIL
    // ─────────────────────────────
    await transporter.sendMail({
      from: `"UniFlow-cu" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject,
      html,
    });

    // ─────────────────────────────
    // 🧾 LOG SEND (SOURCE OF TRUTH)
    // ─────────────────────────────
    await throttleRef.set({
      uid,
      eventId,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email send failed:", err);
    return res.status(500).json({ error: "Email failed" });
  }
}

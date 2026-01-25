import nodemailer from "nodemailer";

/* ─────────────────────────────
   📧 SMTP TRANSPORT (GMAIL)
───────────────────────────── */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // full gmail id
    pass: process.env.EMAIL_PASS, // APP PASSWORD (16 chars)
  },
});

/* ─────────────────────────────
   🚀 HANDLER
───────────────────────────── */
export default async function handler(req, res) {
  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      email,
      eventTitle,
      date,
      time,
      location,
    } = req.body;

    // Basic validation
    if (!email || !eventTitle) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // 🔔 SEND EMAIL (BEST EFFORT)
    await transporter.sendMail({
      from: `"UniFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎟️ Registration Confirmed: ${eventTitle}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <h2>🎟️ Registration Confirmed</h2>
          <p>You are successfully registered for:</p>

          <div style="padding:12px;border:1px solid #ddd;border-radius:8px">
            <h3>${eventTitle}</h3>
            <p><b>Date:</b> ${date || "TBA"} ${time || ""}</p>
            <p><b>Location:</b> ${location || "TBA"}</p>
          </div>

          <p style="margin-top:16px">
            Please show your ticket in the UniFlow app during entry.
          </p>

          <p style="margin-top:24px;font-size:12px;color:#666">
            UniFlow is a technology platform. Event execution is handled by the organizer.
          </p>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("EMAIL ERROR:", err);

    // ❗ Never break frontend
    return res.status(200).json({
      success: false,
      note: "Email failed but registration is safe",
    });
  }
}

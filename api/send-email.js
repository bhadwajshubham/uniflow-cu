import nodemailer from 'nodemailer';

/* ─────────────────────────────
   📧 SMTP TRANSPORT (GMAIL)
───────────────────────────── */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your gmail id
    pass: process.env.EMAIL_PASS, // gmail app password
  },
});

/* ─────────────────────────────
   🚀 API HANDLER
───────────────────────────── */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, eventTitle, date, time, location } = req.body;

    // 🔒 Basic validation (nothing fancy)
    if (!email || !eventTitle || !date || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 📧 Send Email
    await transporter.sendMail({
      from: `"UniFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎟️ Registration Confirmed: ${eventTitle}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <h2>🎟️ Registration Confirmed</h2>
          <p>You are successfully registered for:</p>

          <div style="padding:16px;border:1px solid #eee;border-radius:8px">
            <p><strong>Event:</strong> ${eventTitle}</p>
            <p><strong>Date:</strong> ${date} ${time || ''}</p>
            <p><strong>Location:</strong> ${location}</p>
          </div>

          <p style="margin-top:16px">
            Please show your ticket inside the UniFlow app at the venue.
          </p>

          <p style="margin-top:24px;font-size:12px;color:#666">
            UniFlow is a technology platform. Event execution is handled by the organizer.
          </p>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('EMAIL ERROR:', err);
    // ❗ Never break frontend
    return res.status(200).json({ success: false });
  }
}

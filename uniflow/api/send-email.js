import nodemailer from "nodemailer";

/* ─────────────── SMTP CONFIG ─────────────── */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // gmail id
    pass: process.env.EMAIL_PASS, // app password
  },
});

/* ─────────────── API HANDLER ─────────────── */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: "Missing email payload" });
    }

    await transporter.sendMail({
      from: `"UniFlow" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("EMAIL ERROR:", err);
    return res.status(500).json({ error: "Email failed" });
  }
}

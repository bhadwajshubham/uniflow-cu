import nodemailer from "nodemailer";

/* ─────────────────────────────
   📧 SMTP TRANSPORT (GMAIL)
───────────────────────────── */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // eg: yourgmail@gmail.com
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

/* ─────────────────────────────
   🚀 API HANDLER
───────────────────────────── */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { to, subject, html } = req.body;

    // 🛑 BASIC VALIDATION
    if (!to || !subject || !html) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // 🛑 SIMPLE RATE LIMIT (PER REQUEST)
    // prevents accidental loops / abuse
    if (subject.length > 200 || html.length > 20000) {
      return res.status(400).json({ error: "Payload too large" });
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

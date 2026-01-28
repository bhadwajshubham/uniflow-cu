import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // 1. CORS Setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 🕵️‍♂️ SHUBHAM DEBUGGER 555 - LOOK FOR THIS IN LOGS
  console.log("--- SHUBHAM DEBUGGER 555 STARTED ---");

  // 2. SAFETY NET: Check BOTH Uppercase and Lowercase keys
  const user = process.env.GMAIL_USER || process.env.gmail_user;
  const pass = process.env.GMAIL_PASS || process.env.gmail_pass;

  console.log("USER FOUND:", user ? "YES" : "NO");
  console.log("PASS FOUND:", pass ? "YES" : "NO");

  if (!user || !pass) {
    console.error("❌ CRITICAL: Credentials missing.");
    return res.status(500).json({ error: 'SERVER_CONFIG_ERROR', details: 'Check Vercel Env Vars' });
  }

  const { to, email, subject, html } = req.body;
  const recipient = to || email;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass.replace(/\s/g, '') // Remove spaces
      }
    });

    // 3. Send Mail
    const info = await transporter.sendMail({
      from: '"UniFlow Tickets" <hackathonshubham@gmail.com>',
      to: recipient,
      subject: subject || "Ticket Confirmed",
      html: html || "<p>Your ticket is confirmed.</p>",
    });

    console.log("✅ EMAIL SENT:", info.messageId);
    return res.status(200).json({ success: true, id: info.messageId });

  } catch (error) {
    console.error("❌ EMAIL FAILED:", error);
    return res.status(500).json({ error: 'EMAIL_FAILED', details: error.message });
  }
}
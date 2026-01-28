import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  console.log("--- CREDENTIALS CHECK ---");
  // 1. Check keys using UPPERCASE (Matches your screenshot)
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  console.log("User Exists?", user ? "YES" : "NO");
  console.log("Pass Exists?", pass ? "YES" : "NO");

  if (!user || !pass) {
    console.error("❌ CRITICAL: Variables are undefined. Check Vercel Settings.");
    return res.status(500).json({ error: 'Server Config Error: Missing Env Vars' });
  }

  const { to, email, subject, html } = req.body;
  const recipient = to || email;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user, // Using the UPPERCASE variable
        pass: pass.replace(/\s/g, '') // Clean up spaces
      }
    });

    const info = await transporter.sendMail({
      from: '"UniFlow" <noreply@uniflow.com>',
      to: recipient,
      subject: subject || "Ticket",
      html: html || "<p>Confirmed</p>",
    });

    console.log("✅ SUCCESS:", info.messageId);
    return res.status(200).json({ success: true, id: info.messageId });
  } catch (error) {
    console.error("❌ EMAIL FAILED:", error);
    return res.status(500).json({ error: 'Email Failed', details: error.message });
  }
}
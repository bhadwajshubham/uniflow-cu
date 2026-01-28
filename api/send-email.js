import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 🕵️‍♂️ SPY LOGS: Check if variables exist
  console.log("--- DEBUG START ---");
  console.log("GMAIL_USER Status:", process.env.GMAIL_USER ? "✅ Loaded" : "❌ MISSING");
  console.log("GMAIL_PASS Status:", process.env.GMAIL_PASS ? "✅ Loaded" : "❌ MISSING");
  console.log("GMAIL_PASS Length:", process.env.GMAIL_PASS ? process.env.GMAIL_PASS.length : 0); // Should be 16 (or 19 with spaces)
  console.log("--- DEBUG END ---");

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    return res.status(500).json({ error: 'Server Misconfiguration: Credentials Missing in Vercel' });
  }

  const { to, email, subject, html } = req.body;
  const recipient = to || email;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS.replace(/\s/g, '') // Remove spaces for safety
      }
    });

    const info = await transporter.sendMail({
      from: '"UniFlow" <noreply@uniflow.com>',
      to: recipient,
      subject: subject || "Ticket",
      html: html || "<p>Confirmed</p>",
    });

    return res.status(200).json({ success: true, id: info.messageId });
  } catch (error) {
    console.error("❌ EMAIL ERROR:", error);
    return res.status(500).json({ error: 'Email Failed', details: error.message });
  }
}
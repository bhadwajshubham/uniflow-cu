// api/send-email.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // 1. Security: Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  // 2. Configure Gmail Transporter
  // Vercel pulls these from "Environment Variables" (Settings -> Env Vars)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // Your Gmail
      pass: process.env.GMAIL_PASS  // Your 16-digit App Password
    }
  });

  try {
    // 3. Send the Email
    await transporter.sendMail({
      from: '"UniFlow Events" <noreply@uniflow.com>', // Sender Name
      to,
      subject,
      html
    });

    console.log(`✅ Email sent to ${to}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Email API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
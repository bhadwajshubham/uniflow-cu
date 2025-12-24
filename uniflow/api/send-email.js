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

  // 2. Configure Gmail
  // Vercel will pull these from "Environment Variables" later
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, 
      pass: process.env.GMAIL_PASS 
    }
  });

  try {
    // 3. Send the Email
    await transporter.sendMail({
      from: '"UniFlow Events" <noreply@uniflow.com>',
      to,
      subject,
      html
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
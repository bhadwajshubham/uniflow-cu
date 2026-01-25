import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // 🔒 LOCKED
    pass: process.env.EMAIL_PASS, // 🔒 LOCKED (App Password)
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Hard safety check
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Missing EMAIL_USER / EMAIL_PASS');
    return res.status(500).json({ error: 'Email env not configured' });
  }

  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing email payload' });
    }

    await transporter.sendMail({
      from: `"UniFlow Events" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to}`);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ EMAIL ERROR:', err);
    return res.status(500).json({ error: 'Email failed' });
  }
}

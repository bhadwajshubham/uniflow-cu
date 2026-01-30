import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // ✅ 1. CORS HEADERS (Important for Vercel to allow Frontend requests)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // ✅ 2. Handle Preflight (OPTIONS request)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ 3. Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // ✅ 4. Load Environment Variables (Supports both naming conventions)
  const user = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const pass = process.env.GMAIL_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.error("❌ ERROR: Email credentials missing in Vercel Settings.");
    return res.status(500).json({ error: 'Server Config Error: Credentials missing' });
  }

  const { to, subject, html } = req.body;

  if (!to || !html) {
    return res.status(400).json({ error: 'Missing "to" or "html" in request body' });
  }

  try {
    // ✅ 5. Create Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass.replace(/\s/g, '') // Remove spaces from password if any
      }
    });

    // ✅ 6. Send Email
    const info = await transporter.sendMail({
      from: `"UniFlow Events" <${user}>`,
      to: to,
      subject: subject || "Event Update",
      html: html,
    });

    console.log("✅ Email Sent Successfully. ID:", info.messageId);
    return res.status(200).json({ success: true, message: 'Email sent', id: info.messageId });

  } catch (error) {
    console.error("❌ Email Sending Failed:", error);
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}
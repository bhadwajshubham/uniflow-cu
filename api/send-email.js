import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  console.log("--- DEBUGGER V3 START ---"); // Look for this in logs

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  // 1. If Creds are missing, send detailed error to Browser (Frontend)
  if (!user || !pass) {
    console.error("❌ MISSING VARIABLES");
    return res.status(500).json({ 
      error: 'ENV_VAR_MISSING', 
      details: {
        user_status: user ? 'Loaded' : 'MISSING',
        pass_status: pass ? 'Loaded' : 'MISSING',
        instruction: 'Go to Vercel Settings -> Environment Variables and check spelling.'
      }
    });
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

    // 2. Send Email
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
    return res.status(500).json({ 
      error: 'EMAIL_SEND_FAILED', 
      details: error.message 
    });
  }
}
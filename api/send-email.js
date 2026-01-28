import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // 1. Allow connection from anywhere
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 2. CHECK ENVIRONMENT VARIABLES (The #1 Cause of Failure)
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    return res.status(500).json({ 
      error: 'CONFIGURATION_ERROR', 
      message: 'Vercel Env Variables are MISSING. Go to Vercel Settings -> Environment Variables.' 
    });
  }

  const { to, email, subject, html } = req.body;
  const recipient = to || email;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS.replace(/\s/g, '') // 🛡️ AUTOMATICALLY REMOVE SPACES
      }
    });

    // 3. Verify Login
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error("Login Failed:", error);
          reject(new Error(`LOGIN_FAILED: ${error.message}`));
        } else {
          resolve(success);
        }
      });
    });

    // 4. Send
    const info = await transporter.sendMail({
      from: '"UniFlow Events" <noreply@uniflow.com>',
      to: recipient,
      subject: subject || "Ticket Confirmed",
      html: html || "<p>Ticket Confirmed</p>",
    });

    return res.status(200).json({ success: true, id: info.messageId });

  } catch (error) {
    console.error("❌ CRITICAL EMAIL ERROR:", error);
    
    // 🚨 RETURN THE EXACT ERROR TO THE FRONTEND
    return res.status(500).json({ 
      error: 'CRITICAL_DEBUG_ERROR', 
      details: error.message, // This will say "Invalid Login" or "Username not accepted"
      originalError: error.toString() 
    });
  }
}
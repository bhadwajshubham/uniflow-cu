import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, email, subject, html } = req.body;
  const recipient = to || email;

  if (!recipient) {
    return res.status(400).json({ error: 'No recipient provided' });
  }

  try {
    // 2. Setup Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    // 3. Verify Connection FIRST (Debug Step)
    await new Promise((resolve, reject) => {
      transporter.verify(function (error, success) {
        if (error) reject(error);
        else resolve(success);
      });
    });

    // 4. Send Email
    const info = await transporter.sendMail({
      from: '"UniFlow Team" <noreply@uniflow.com>',
      to: recipient,
      subject: subject || "Ticket Confirmation",
      html: html || "<p>Ticket Confirmed</p>",
    });

    console.log("✅ Email Sent:", info.messageId);
    return res.status(200).json({ success: true, id: info.messageId });

  } catch (error) {
    console.error("❌ BACKEND ERROR:", error);
    
    // 🚨 THIS IS THE IMPORTANT PART
    // We send the ACTUAL error message back to you
    return res.status(500).json({ 
      error: 'Email Failed', 
      details: error.message,  // e.g. "Invalid login"
      code: error.code         // e.g. "EAUTH"
    });
  }
}
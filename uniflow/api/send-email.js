import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // 1. Check Method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 2. Debugging: Check if Variables exist (Don't log the actual password!)
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error("❌ MISSING ENV VARIABLES: User or Pass is undefined.");
    return res.status(500).json({ error: 'Server Configuration Error: Missing Credentials' });
  }

  const { to, subject, html } = req.body;

  // 3. Configure Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS // Ensure this is the 16-digit App Password
    }
  });

  try {
    // 4. Verify Connection First
    await new Promise((resolve, reject) => {
      transporter.verify(function (error, success) {
        if (error) {
          console.error("❌ SMTP Connection Failed:", error);
          reject(error);
        } else {
          console.log("✅ SMTP Connected. Ready to send.");
          resolve(success);
        }
      });
    });

    // 5. Send Email
    await transporter.sendMail({
      from: '"UniFlow Events" <noreply@uniflow.com>',
      to,
      subject,
      html
    });

    console.log(`✅ Email sent successfully to ${to}`);
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Email Sending Failed:', error);
    return res.status(500).json({ error: error.message });
  }
}
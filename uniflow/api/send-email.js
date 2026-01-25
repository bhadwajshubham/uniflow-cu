// File: api/sendEmail.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Sirf POST request accept karega
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, name, ticketId } = req.body;

  try {
    // Gmail Transporter Setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Tera Gmail
        pass: process.env.EMAIL_PASS, // 16-digit App Password
      },
    });

    // Email Bhejo
    await transporter.sendMail({
      from: `"HackFest 2026" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Your Event Ticket is Confirmed!",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center;">
          <h2>Hello ${name},</h2>
          <p>Your registration is successful.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; display: inline-block;">
            <p><strong>Ticket ID:</strong> ${ticketId}</p>
          </div>
          <p>Please keep this ID handy for entry.</p>
        </div>
      `,
    });

    console.log(`✅ Email sent to ${email}`);
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Nodemailer Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
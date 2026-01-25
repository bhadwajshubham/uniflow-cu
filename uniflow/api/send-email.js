import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Sirf POST request allow karenge (Security)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Frontend se ye data aayega
  const { email, name, ticketId, eventName, eventDate, eventLocation } = req.body;

  if (!email || !ticketId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Gmail Transporter Setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Tera Gmail address
        pass: process.env.EMAIL_PASS, // 16-digit App Password
      },
    });

    // 2. Email Body (HTML Template)
    const mailOptions = {
      from: `"UniFlow Events" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎉 Ticket Confirmed: ${eventName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">Registration Successful!</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>You are officially registered for <strong>${eventName}</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Your Ticket ID</p>
            <h1 style="margin: 5px 0; font-family: monospace; letter-spacing: 2px; color: #1f2937;">${ticketId}</h1>
          </div>

          <p><strong>Date:</strong> ${eventDate || 'TBA'}</p>
          <p><strong>Location:</strong> ${eventLocation || 'Chitkara University'}</p>

          <p style="color: #4b5563; font-size: 12px; margin-top: 30px; text-align: center;">
            Please show this Ticket ID or your QR code at the entrance.<br>
            Powered by UniFlow.
          </p>
        </div>
      `,
    };

    // 3. Send Email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to: ${email}`);
    
    // Return Success
    return res.status(200).json({ success: true, message: 'Email sent successfully' });

  } catch (error) {
    console.error('❌ Nodemailer Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
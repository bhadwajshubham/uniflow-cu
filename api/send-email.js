import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      email,
      name,
      ticketId,
      eventName,
      eventDate,
      eventLocation,
    } = req.body;

    if (!email || !ticketId || !eventName) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"UniFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎟️ Ticket Confirmed: ${eventName}`,
      html: `
        <h2>Registration Confirmed</h2>
        <p>Hello ${name || 'Student'},</p>
        <p><b>Event:</b> ${eventName}</p>
        <p><b>Date:</b> ${eventDate || '-'}</p>
        <p><b>Location:</b> ${eventLocation || '-'}</p>
        <p><b>Ticket ID:</b> ${ticketId}</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('EMAIL ERROR:', err);
    return res.status(500).json({ error: 'Email failed' });
  }
}

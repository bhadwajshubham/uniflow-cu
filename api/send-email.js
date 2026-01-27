import nodemailer from "nodemailer";

/**
 * POST /api/send-email
 * Fire-and-forget email sender
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🔐 Gmail SMTP (same as your OLD working zip)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password
      },
    });

    // ✉️ Mail Content
    await transporter.sendMail({
      from: `"UniFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎟️ Registration Confirmed: ${eventName}`,
      html: `
        <h2>Registration Successful 🎉</h2>
        <p>Hello <b>${name || "Student"}</b>,</p>
        <p>You are successfully registered for:</p>
        <ul>
          <li><b>Event:</b> ${eventName}</li>
          <li><b>Date:</b> ${eventDate || "—"}</li>
          <li><b>Location:</b> ${eventLocation || "—"}</li>
          <li><b>Ticket ID:</b> ${ticketId}</li>
        </ul>
        <p>Please show this ticket at the entry gate.</p>
        <br/>
        <p>— UniFlow Team</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("EMAIL ERROR:", err);
    // ⚠️ Never break registration flow
    return res.status(200).json({ success: false });
  }
}

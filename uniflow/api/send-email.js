import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  console.log("✅ EMAIL API HIT");

  const {
    email,
    name,
    ticketId,
    eventName,
    eventDate,
    eventLocation,
  } = req.body || {};

  if (!email) {
    console.error("❌ Email missing in request");
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"UniFlow Events" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎟 Ticket Confirmed: ${eventName}`,
      html: `
        <h2>Registration Confirmed</h2>
        <p>Hi ${name || "Participant"},</p>
        <p><b>Event:</b> ${eventName}</p>
        <p><b>Ticket ID:</b> ${ticketId}</p>
        <p><b>Date:</b> ${eventDate}</p>
        <p><b>Location:</b> ${eventLocation}</p>
      `,
    });

    console.log("📧 Email sent successfully");

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ EMAIL ERROR:", err);
    return res.status(500).json({ error: "Email sending failed" });
  }
}

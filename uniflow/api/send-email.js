import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // same name, no change
    pass: process.env.EMAIL_PASS, // app password
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, eventTitle, date, time, location } = req.body;

    if (!email || !eventTitle) {
      return res.status(400).json({ error: "Missing fields" });
    }

    await transporter.sendMail({
      from: `"UniFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎟️ Ticket Confirmed: ${eventTitle}`,
      html: `
        <h2>Registration Confirmed</h2>
        <p><b>${eventTitle}</b></p>
        <p>${date} ${time}</p>
        <p>${location}</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("EMAIL ERROR:", err);
    return res.status(500).json({ error: "Email failed" });
  }
}

import dotenv from "dotenv";
import path from "path";

// Decide which env file to load based on NODE_ENV
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";

dotenv.config({ path: path.resolve(__dirname, "../", envFile) });
import nodemailer from "nodemailer";

export async function sendTrackASaleConfEmail({
  buyerEmail,
  event,
  amount,
  commission,
}: {
  buyerEmail: string;
  event: string;
  amount: number;
  commission: number;
}) {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail", // or use SMTP or Mailgun, etc.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Your Company Name" <princetongreen.org>`,
      to: buyerEmail,
      subject: "New Commission",
      html: `
        <h2>Hello there!</h2>
        <p>${buyerEmail} successfully purchased <strong>${event}</strong> for $${amount}.</p>
        <p>Your affiliate commission applied: $${commission.toFixed(2)}</p>
        <p>Look for a payment in your bank account within the next 30 days!</p>
        <p>Thank you.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Confirmation email sent to ${buyerEmail}`);
  } catch (err) {
    console.error("❌ Failed to send confirmation email:", err);
  }
}

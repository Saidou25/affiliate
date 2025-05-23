import dotenv from "dotenv";
import path from "path";

// Decide which env file to load based on NODE_ENV
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env";

dotenv.config({ path: path.resolve(__dirname, "../", envFile) });
import nodemailer from "nodemailer";

export async function sendConfirmationEmail({
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
      from: "princetongreen",
      to: buyerEmail,
      subject: "Your Purchase Confirmation",
      html: `
        <h2>Thank you for your purchase!</h2>
        <p>You've successfully purchased <strong>${event}</strong> for $${amount}.</p>
        <p>We appreciate your support!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Confirmation email sent to ${buyerEmail}`);
  } catch (err) {
    console.error("❌ Failed to send confirmation email:", err);
  }
}

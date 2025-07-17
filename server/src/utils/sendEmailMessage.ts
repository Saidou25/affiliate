import dotenv from "dotenv";
import path from "path";
import nodemailer from "nodemailer";
import { SendEmailArgs } from "../graphql/types";

const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: path.resolve(__dirname, "../", envFile) });

export async function sendEmailMessage({
  type = "generic",
  affiliateEmail,
  buyerEmail,
  title,
  text,
  event,
  amount,
  commission,
  refId,
}: SendEmailArgs & { type?: "sale" | "confirmation" | "generic" }) {
  try {
    console.log("in sendEmailMessage")
    console.log("SMTP user:", process.env.EMAIL_USER);
    console.log("SMTP pass length:", process.env.EMAIL_PASS); // Don't print full password!
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Dynamic subject & body based on type
    let subject = title || "Notification";
    let html = `<h2>${title || "Notification"}</h2><p>${text || ""}</p>`;

    if (type === "sale") {
      subject = "New Commission Applied";
      html = `
        <h2>Hello there!</h2>
        <p>${buyerEmail} successfully purchased <strong>${event}</strong> for $${amount}.</p>
        <p>Your affiliate commission applied: $${commission?.toFixed(2)}</p>
        <p>Look for a payment in your bank account within the next 30 days!</p>
        <p>Thank you.</p>
      `;
    }

    if (type === "confirmation") {
      subject = "Confirmation Email";
      html = `
        <h2>${title}</h2>
        <p>${text}</p>
        ${event ? `<p>Event: <strong>${event}</strong></p>` : ""}
        ${refId ? `<p>Ref ID: ${refId}</p>` : ""}
      `;
    }

    const mailOptions = {
      from: `<${process.env.EMAIL_USER}>`,
      to: affiliateEmail,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 [${type}] Email sent to ${affiliateEmail}`);
  } catch (err) {
    console.error(`❌ Failed to send [${type}] email:`, err);
  }
}

import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

const sendWithSendGrid = async ({ to, subject, text, html }) => {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER;

  if (!apiKey || !from) {
    throw new Error("SendGrid is not configured. Missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL.");
  }

  sgMail.setApiKey(apiKey);
  await sgMail.send({
    to,
    from,
    subject,
    text,
    html
  });
};

const sendWithNodemailer = async ({ to, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    // Force IPv4 to avoid ENETUNREACH on IPv6-only SMTP resolution
    family: 4
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html
  });
};

const sendEmail = async (to, subject, text) => {
  const payload = {
    to,
    subject,
    text,
    html: `<p>${text}</p>`
  };

  await sendWithNodemailer(payload);
  console.log(`Email sent to ${to}`);
};

export default sendEmail;

import nodemailer from "nodemailer";

const sendEmail = async (to, subject, text) => {
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
    html: `<p>${text}</p>`
  });
  console.log(`Email sent to ${to}`);
};

export default sendEmail;

import nodemailer from "nodemailer";

const sendEmail = async (to, subject, text) => {
  // Configure your email service here
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html: `<p>${text}</p>`
  };

  await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${to}`);
};

export default sendEmail;

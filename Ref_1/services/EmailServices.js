import nodemailer from 'nodemailer';

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Correct SMTP server
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send an email
export const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: process.env.FromMail || "info@avatarwalk.com",
    to,
    subject,
    html,
  };


  return transporter.sendMail(mailOptions);
};





// 
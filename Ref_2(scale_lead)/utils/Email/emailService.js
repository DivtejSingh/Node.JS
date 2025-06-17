import nodemailer from 'nodemailer';

// Create a transporter object using SMTP transport


// Function to send an email
export const sendEmail = async (transporterInstance,from,to, subject, html) => {
  const mailOptions = {
    from: from,
    to,
    subject,
    html,
  };


  return transporterInstance.sendMail(mailOptions);
};





// 
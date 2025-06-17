export const createEmailHtml = (otp) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #e9ecef;
            margin: 0;
            padding: 0;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .otp {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin: 20px 0;
          }
          .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #aaaaaa;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Password Reset Request</h1>
          <p>Your OTP for verification resetting your password is:</p>
          <div class="otp">${otp}</div>
          <p class="footer">This OTP will expire in 10 minutes.</p>
        
        </div>
      </body>
    </html>
  `;
};
export const createBugReportEmailHtml = (description, userEmail, timestamp) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #e9ecef;
            margin: 0;
            padding: 0;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .instructions {
            font-size: 16px;
            color: #555555;
            margin: 20px 0;
          }
          .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #aaaaaa;
          }
          .bug-description {
            font-size: 16px;
            margin-top: 10px;
            color: #333333;
            border: 1px solid #cccccc;
            padding: 10px;
            border-radius: 4px;
            background-color: #f8f9fa;
          }
          .user-info {
            margin-top: 20px;
            font-size: 14px;
            color: #333333;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>New Bug Report Submitted!</h1>
          <p>A user has reported a bug in the application. Below are the details:</p>
          <p class="instructions">Description of the issue:</p>
          <div class="bug-description">${description}</div>
          <div class="user-info">
            <p><strong>User Email:</strong> ${userEmail}</p>
            <p><strong>Reported On:</strong> ${timestamp}</p>
          </div>
          <p class="footer">Thank you for your attention to this matter!</p>
        </div>
      </body>
    </html>
  `;
};


export const messageNotification=()=>{
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #e9ecef;
          margin: 0;
          padding: 0;
        }
        .container {
          background-color: #ffffff;
          margin: 0 auto;
          padding: 40px 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          text-align: center;
        }
        h1 {
          color: #333333;
          font-size: 24px;
          margin-bottom: 20px;
        }
        p {
          color: #666666;
          font-size: 16px;
          margin-bottom: 20px;
        }
        .otp {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          margin: 20px 0;
        }
        .footer {
          margin-top: 20px;
          font-size: 14px;
          color: #aaaaaa;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>You got Some messages on avtar</h1>
      
      </div>
    </body>
  </html>
`;
}

export const createAvatarRequestEmail = (userEmail) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .email {
            font-size: 20px;
            font-weight: bold;
            color: #007bff;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .email {
              font-size: 18px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>New Avatar Signup Request</h1>
          <p>A new user has requested to sign up as an avatar. Below are the details:</p>
          
          <p class="email">Name: ${userEmail.userName}</p>
          <p class="email">Email: ${userEmail.email}</p>
          <p>Please review the request and take appropriate action.</p>
          <p class="footer">Thank you for managing the avatar approval process!</p>
        </div>
      </body>
    </html>
  `;
};


export const stripeAccountSuccessEmail = (userDetails) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .success {
            font-size: 20px;
            font-weight: bold;
            color: #28a745;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .success {
              font-size: 18px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Stripe Account Added Successfully!</h1>
          <p>Hello ${userDetails.userName},</p>
          <p>Your Stripe account has been successfully linked to your profile. You can now receive payments securely through Stripe.</p>
          
          <p class="success">Account Email: ${userDetails.email}</p>
          <p>Feel free to start receiving payments for your bookings and experiences.</p>
          <p class="footer">If you have any questions, don't hesitate to contact support.</p>
        </div>
      </body>
    </html>
  `;
};


export const refundSuccessEmail = (refundDetails) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .refund-details {
            font-size: 18px;
            font-weight: bold;
            color: #ff6347;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .refund-details {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Refund Processed Successfully</h1>
          <p>Hello ${refundDetails.userName},</p>
          <p>We have successfully processed your refund. Below are the details of the transaction:</p>
          
          <div class="refund-details">
            <p>Amount: ${refundDetails.amount}</p>
            <p>Refund Date: ${refundDetails.refundDate}</p>
            <p>Transaction ID: ${refundDetails.transactionId}</p>
          </div>
          
          <p>If you have any further questions, feel free to contact our support team.</p>
          <p class="footer">Thank you for choosing our service.</p>
        </div>
      </body>
    </html>
  `;
};


export const paymentSuccessEmail = (email,paymentDetails) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .payment-details {
            font-size: 18px;
            font-weight: bold;
            color: #28a745;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .payment-details {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Payment Successful</h1>
          <p>Hello ${email.userName},</p>
          <p>We are pleased to inform you that your payment was processed successfully. Below are the details of your transaction:</p>
          
          <div class="payment-details">
            <p>Amount: ${paymentDetails.totalprice}</p>
         
            <p>Transaction ID: ${paymentDetails.SessionId}</p>
          </div>
          
   
          <p>If you have any questions or concerns, feel free to contact our support team.</p>
          <p class="footer">Thank you for your payment!</p>
        </div>
      </body>
    </html>
  `;
};

export const bookingSuccessEmail = (expName,userName, bookingDetails,readableDate,readableTime,avatarname) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .booking-details {
            font-size: 18px;
            font-weight: bold;
            color: #28a745;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .booking-details {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>New Booking Confirmed!</h1>
          <p>Hello ${userName},</p>
          <p>We are excited to confirm your new booking. Below are the details:</p>
          
          <div class="booking-details">
            <p>Experience Name: ${expName}</p>
            <p>Avatar Name: ${avatarname}</p>
            
            <p>Booking Date : ${readableDate}</p>
            <p>Booking Time : ${readableTime}</p>
            <p>Duration : ${bookingDetails?.Duration}</p>
            
            <p>Booking Status:  ${bookingDetails.status}</p>
        
          </div>
          
          <p>If you need to make any changes or have questions, please don't hesitate to contact us.</p>
          <p class="footer">Thank you for choosing our service!</p>
        </div>
      </body>
    </html>
  `;
};

export const avatarNewBookingEmail = (avatarname,newBooking,expName,userName,readableDate,readableTime) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .tour-details {
            font-size: 18px;
            font-weight: bold;
            color: #007bff;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .tour-details {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>New Tour Booking Alert!</h1>
          <p>Hello ${avatarname},</p>
          <p>You have a new tour booking! Here are the details:</p>
          
          <div class="tour-details">
            <p>Tour Name: ${expName}</p>
            <p>Date : ${readableDate} </p>
            <p>Time : ${readableTime} </p>
            <p>Duration : ${newBooking.Duration} </p>
            <p>Client: ${userName}</p>
            <p>Status: ${newBooking.status}</p>
          </div>
          
          <p>Please ensure you are prepared for the scheduled time. If you have any questions or need assistance, feel free to contact support.</p>
          <p class="footer">Thank you for being a valued part of our community!</p>
        </div>
      </body>
    </html>
  `;
};



export const ExpCreatedSuccessEmail = (userName,experienceDetails) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .experience-details {
            font-size: 18px;
            font-weight: bold;
            color: #28a745;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .experience-details {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Experience Created Successfully!</h1>
          <p>Hello ${userName},</p>
          <p>Your new experience has been created and is now available for booking. Here are the details of your experience:</p>
          
          <div class="experience-details">
            <p>Experience Name: ${experienceDetails.ExperienceName}</p>
            <p>Country: ${experienceDetails.country}</p>
            <p>State: ${experienceDetails.State}</p>
            <p>City: ${experienceDetails.city}</p>
            <p>Rate Per Minute: ${experienceDetails.AmountsperMinute} $</p>
          </div>
          
          <p>If you need to make any changes or have questions, feel free to reach out to us.</p>
          <p class="footer">Thank you for creating with us!</p>
        </div>
      </body>
    </html>
  `;
};


export const userAddedSuccess = (details) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .experience-details {
            font-size: 18px;
            font-weight: bold;
            color: #28a745;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .experience-details {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
       <div class="container">
          <h1>Welcome to Our Platform!</h1>
          <p>Hello ${details.userName},</p>
          <p>We’re excited to let you know that your account has been successfully created! Here are your details:</p>
          
          <div class="user-details">
            <p><strong>User Name:</strong> ${details.userName}</p>
            <p><strong>Email:</strong> ${details.email}</p>
          </div>
          
          <p>You can now explore our platform, book experiences, and enjoy all the features we have to offer.</p>
          <p>If you have any questions or need assistance, feel free to reach out to our support team at any time.</p>
          
          <p class="footer">Thank you for joining us!</p>
        </div>
      </body>
    </html>
  `;
};

export const adminNotificationSuccess = (details) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .user-details {
            font-size: 18px;
            font-weight: bold;
            color: #007bff;
            margin: 20px 0;
            text-align: left;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .user-details {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>New User Registered!</h1>
          <p>Hello Admin,</p>
          <p>A new user has successfully registered on your platform. Below are their details:</p>
          
          <div class="user-details">
            <p><strong>User Name:</strong> ${details.userName}</p>
            <p><strong>Email:</strong> ${details.email}</p>
            <p><strong>Account Created At:</strong> ${details.createdAt}</p>
          </div>
          
      
        </div>
      </body>
    </html>
  `;
};


export const bookingSuccessEmailAfterAccept = (userName,bookingDetails) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .booking-details {
            font-size: 18px;
            font-weight: bold;
            color: #28a745;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .booking-details {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>New Booking Confirmed!</h1>
          <p>Hello ${userName}</p>
          <p>your booked Duration: ${bookingDetails.Duration}</p>
          <p>Tour Date & Time: ${bookingDetails.TimeString}</p>
          <p>your Tour End Time: ${bookingDetails.endTime} </p>
          <p>Amount Per Minute: ${bookingDetails.amountPerminute}$</p>
          
          <div class="booking-details">
            <p>Your Booking is confirmed Successfully You can join on your booking time</p>
          </div>
          
          <p>If you need to make any changes or have questions, please don't hesitate to contact us.</p>
          <p class="footer">Thank you for choosing our service!</p>
        </div>
      </body>
    </html>
  `;
};
export const bookingCancelEmailAfterCancel=(userName)=>{
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f7;
          margin: 0;
          padding: 0;
          -webkit-text-size-adjust: none;
          width: 100%;
        }
        .container {
          background-color: #ffffff;
          margin: 0 auto;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          text-align: center;
        }
        h1 {
          color: #333333;
          font-size: 24px;
          margin-bottom: 20px;
        }
        p {
          color: #666666;
          font-size: 16px;
          margin-bottom: 20px;
        }
        .booking-details {
          font-size: 18px;
          font-weight: bold;
          color: #28a745;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          color: #999999;
        }
        @media (max-width: 600px) {
          .container {
            padding: 20px;
          }
          h1 {
            font-size: 20px;
          }
          .booking-details {
            font-size: 16px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1> Booking Cancelled!</h1>
        <p>Hello ${userName}</p>

        
        <div class="booking-details">
          <p>Your Booking is Cancelled by Avtar Due To Some reason</p>
        </div>
        
        <p>If you need to make any changes or have questions, please don't hesitate to contact us.</p>
        <p class="footer">Thank you for choosing our service!</p>
      </div>
    </body>
  </html>
`;
}

export const meetingStartNotificationEmail = (users, meeting,id) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .meeting-details {
            font-size: 18px;
            font-weight: bold;
            color: #28a745;
            margin: 20px 0;
          }
          a.button {
            background-color: #007bff;
            color: #ffffff;
            padding: 15px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin-top: 20px;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .meeting-details {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Your Meeting is Starting Soon!</h1>
          <p>Hello ${users?.userName},</p>
          <p>Your meeting is about to start. Please join the live stream using the link below:</p>
          
          <div class="meeting-details">
            <p>Meeting Topic: your Tour is Live</p>
            <p>Start Time: ${meeting.startTime}</p>
          </div>
          
          <a href="https://www.avatarwalk.com/user/room_join/${id}" class="button">Join Live Stream</a>
          
          <p>If you have any questions or issues, feel free to reach out to us.</p>
          <p class="footer">We hope you enjoy your session!</p>
        </div>
      </body>
    </html>
  `;
};






export const adminNotificationTourCreated = (userName,email,newExperience) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .tour-details {
            font-size: 18px;
            font-weight: bold;
            color: #007bff;
            margin: 20px 0;
            text-align: left;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .tour-details {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>New Tour Created!</h1>
   
          <p>A new tour has been successfully created on your platform. Here are the details:</p>
          
          <div class="tour-details">
            <p><strong>Tour Title:</strong> ${newExperience.ExperienceName}</p>
            <p><strong>Location:</strong> ${newExperience.city},${newExperience.country}</p>
            <p><strong>Created By:</strong> ${userName}</p>
            <p><strong>User Email:</strong> ${email}</p>
            <p><strong>Created At:</strong> ${newExperience.createdAt}</p>
       
          </div>
        </div>
      </body>
    </html>
  `;
};


export const adminNotificationTourBooked = (experienceName,userName, email, booking) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .tour-details {
            font-size: 18px;
            font-weight: bold;
            color: #007bff;
            margin: 20px 0;
            text-align: left;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .tour-details {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Tour Booked!</h1>
   
          <p>A tour has been successfully booked on your platform. Here are the details:</p>
          
          <div class="tour-details">
            <p><strong>Tour Title:</strong> ${experienceName}</p>
           
            <p><strong>Booked By:</strong> ${userName}</p>
              <p>booked Duration: ${booking.Duration}</p>
          <p>Tour Date & Time: ${booking.TimeString}</p>
            <p><strong>User Email:</strong> ${email}</p>
        
          </div>
        </div>
      </body>
    </html>
  `;
};




export const adminNewBookingEmail = (avatarName, expName, userName, newBooking, readableDate, readableTime) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .booking-details {
            font-size: 18px;
            font-weight: bold;
            color: #007bff;
            margin: 20px 0;
            text-align: left;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .booking-details {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>New Tour Booking Received</h1>
          <p>Dear Admin,</p>
          <p>A new tour has been successfully booked on your platform. Here are the details:</p>
          
          <div class="booking-details">
            <p><strong>Tour Name:</strong> ${expName}</p>
            <p><strong>Avatar (Guide):</strong> ${avatarName}</p>
            <p><strong>Client:</strong> ${userName}</p>
            <p><strong>Date:</strong> ${readableDate}</p>
            <p><strong>Time:</strong> ${readableTime}</p>
            <p><strong>Duration:</strong> ${newBooking.Duration}</p>
            <p><strong>Status:</strong> ${newBooking.status}</p>
          </div>
          
          <p>Please ensure all systems are prepared to support this booking. If there are any issues, contact the respective parties promptly.</p>
          <p class="footer">Thank you for managing the platform efficiently!</p>
        </div>
      </body>
    </html>
  `;
};


//today notification

export const accountupdateConnectedEmail = (userName,email) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            font-size: 16px;
            font-weight: bold;
            text-decoration: none;
            color: #ffffff;
            background-color: #007bff;
            border-radius: 5px;
            cursor: pointer;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Your Stripe Account is Updated!</h1>
          <p>Dear ${userName},Your Stripe Email is: ${email}</p>
          <p>Congratulations! Your Stripe account has been successfully Updated with <strong>AvatarWalk</strong>. You are now able to Make transaction within The application.</p>
          <p>If you have any questions or need assistance, our support team is here to help. Feel free to reach out to us anytime at <a href="mailto:info@avatarwalk.com" style="color: #007bff;">
      
          <p class="footer">Thank you for joining AvatarWalk. We’re excited to have you on board!</p>
        </div>
      </body>
    </html>
  `;
};




export const accountConnectedEmail = (userName,email) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            font-size: 16px;
            font-weight: bold;
            text-decoration: none;
            color: #ffffff;
            background-color: #007bff;
            border-radius: 5px;
            cursor: pointer;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Your Stripe Account is Connected!</h1>
          <p>Dear ${userName}, your stripe Email is:${email}</p>
          <p>Congratulations! Your Stripe account has been successfully connected with <strong>AvatarWalk</strong>. You are now able to Make transaction within The application.</p>
          <p>If you have any questions or need assistance, our support team is here to help. Feel free to reach out to us anytime at <a href="mailto:info@avatarwalk.com" style="color: #007bff;">
      
          <p class="footer">Thank you for joining AvatarWalk. We’re excited to have you on board!</p>
        </div>
      </body>
    </html>
  `;
};



export const stripeAccountAddedAdminNotification = (username, email) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
            line-height: 1.6;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>New Stripe Account Connected</h1>
          <p>Dear Admin,</p>
          <p>We would like to inform you that a Stripe account has been successfully connected to the <strong>AvatarWalk</strong> platform.</p>
          <p><strong>User Details:</strong></p>
          <p><strong>Name:</strong> ${username}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p>This Stripe account is now authorized for processing payments and managing transactions. Please verify that the connection aligns with your platform policies.</p>
        
        </div>
      </body>
    </html>
  `;
};


export const avatarWithdrawNotification = (avatarName, amount, formattedDate) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            width: 100%;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
            line-height: 1.6;
          }
          .details {
            font-size: 18px;
            font-weight: bold;
            color: #007bff;
            margin: 20px 0;
            text-align: left;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #999999;
          }
          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }
            h1 {
              font-size: 20px;
            }
            .details {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Withdrawal Successful!</h1>
          <p>Dear ${avatarName},</p>
          <p>We’re excited to inform you that your withdrawal request has been processed successfully.</p>
          <div class="details">
            <p><strong>Amount:</strong> $${amount}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
          </div>
          <p>The funds have been transferred to your connected Stripe account. Please allow up to 1–3 business days for the transaction to reflect in your account.</p>
          <p>If you have any questions or face any issues, please feel free to contact our support team at <a href="mailto:info@avatarwalk.com" style="color: #007bff;">info@avatarwalk.com</a>.</p>
          <p class="footer">Thank you for being a part of AvatarWalk!</p>
        </div>
      </body>
    </html>
  `;
};

export const avathonnotification = (emailContent) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #e9ecef;
            margin: 0;
            padding: 0;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .link {
            display: inline-block;
            margin: 20px 0;
            padding: 10px 20px;
            font-size: 16px;
            font-weight: bold;
            color: #ffffff;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 4px;
          }
          .link:hover {
            background-color: #0056b3;
          }
          .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #aaaaaa;
          }
        </style>
      </head>
      <body>
        <div class="container">
       <h1>Hii ${emailContent.userName} Your Avathon ${emailContent.avathonname} Has Started!</h1>
          <p>Your avathon has started. Please join the avathon by clicking the "Join" button under the "Avathons" tab in your account.</p>
<p class="footer">If you have any questions, feel free to contact us.</p>

          <p class="footer">If you have any questions, feel free to contact us.</p>
        </div>
      </body>
    </html>
  `;
};

export const avathonJoinNotification = (userName,avathodetails) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #e9ecef;
            margin: 0;
            padding: 0;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #aaaaaa;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome, ${userName}!</h1>
          <p>Congratulations! You have successfully joined the Avathon: <strong>${avathodetails?.
            avathonTitle}</strong>.</p>
  <p>The Avathon is scheduled as follows:</p>
  <ul style="list-style-type: none; padding: 0; margin: 0;">
    <li><strong>Date:</strong> ${avathodetails?.avathonDate}</li>
    <li><strong>Time:</strong> ${avathodetails?.avathonTime}</li>
    <li><strong>Duration:</strong> ${avathodetails?.avathonHours} hours</li>
  </ul>
          <p class="footer">If you have any questions or need assistance, don’t hesitate to reach out to our support team.</p>
          <p class="footer">Best Regards, <br> The Avatar Team</p>
        </div>
      </body>
    </html>
  `;
};

export const notifyAvatarUserJoined = (userName,avathodetails) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #e9ecef;
            margin: 0;
            padding: 0;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #aaaaaa;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>New User Joined Your Avathon!</h1>
          <p>Hello ${avathodetails?.avatarName},</p>
          <p>We’re excited to inform you that <strong>${userName}</strong> has joined your Avathon: <strong>${avathodetails?.avathonTitle}</strong>.</p>
         
          <p class="footer">If you have any questions or need assistance, feel free to contact us.</p>
          <p class="footer">Best Regards, <br> The Avatar Team</p>
        </div>
      </body>
    </html>
  `;
};

export const avathonCreationNotification = (doc) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #e9ecef;
            margin: 0;
            padding: 0;
          }
          .container {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 40px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #aaaaaa;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Avathon Created Successfully!</h1>
          <p>Hello ${doc?.avatarName},</p>
          <p>Congratulations! You have successfully created an Avathon with the following details:</p>
          <ul style="list-style-type: none; padding: 0; margin: 0;">
            <li><strong>Avathon Title:</strong> ${doc?.avathonTitle}</li>
            <li><strong>Date:</strong> ${doc?.avathonDate}</li>
            <li><strong>Time:</strong> ${doc?.avathonTime}</li>
            <li><strong>Duration:</strong> ${doc?.avathonHours} hours</li>
            <li><strong>Duration:</strong> ${doc?.avathonsStatus} </li>
          </ul>
         
          <p class="footer">If you have any questions or need assistance, don’t hesitate to reach out to our support team.</p>
          <p class="footer">Best Regards, <br> The Avatar Team</p>
        </div>
      </body>
    </html>
  `;
};

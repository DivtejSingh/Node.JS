import { Admin } from "../../Models/Admin/AdminModel.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendEmail } from "../../services/EmailServices.js";
import jwt from "jsonwebtoken";
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = "30d";

// Function to generate an access token
export const generateToken = (admin) => {
  // Generate an access token
  const accessToken = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });

  return accessToken;
};

// email template for OTP verification
const generateVerificationEmail = (email, otp) => {
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
              <h1>Your OTP Code</h1>
              <p>Your OTP for verification is:</p>
              <div class="otp">${otp}</div>
              <p class="footer">This OTP will expire in 15 minutes.</p>
              <p class="footer">This email is meant for ${email}</p>
            </div>
          </body>
        </html>
      `;
};

const generatePasswordResetEmail = (email, otp) => {
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
          <p class="footer">This OTP will expire in 15 minutes.</p>
          <p class="footer">This email is meant for ${email}</p>
        </div>
      </body>
    </html>
  `;
};

// admin register

export const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if email is already registered
    let check = await Admin.findOne({ email });
    if (check) {
      return res.status(200).json({ message: "Admin is already registered", isSuccess: false });
    }

    // Generate salt and hash the password
    const salt = bcrypt.genSaltSync(10);
    let hashpass = bcrypt.hashSync(password, salt);

    // Create a new admin and save it to the database
    let newAdmin = new Admin({
      email: email,
      password: hashpass,
    });

    const doc = await newAdmin.save();
    return res.status(200).json({ message: "Successfully registered", isSuccess: true });
  } catch (e) {
    return res.status(404).json({ message: e.message, isSuccess: false });
  }
};

// Login function
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required.",
      });
    }

    // Check if the user exists
    let user = await Admin.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found/Enter Your Correct Email", isSuccess: false });
    }

    // Compare the provided password with the stored hash

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(404).json({ message: "Please enter your correct password", isSuccess: false });
    }

    // Generate token and return successful response
    const token = generateToken(user);
    return res.status(200).json({ message: "Successfully logged in", doc: user, token, isSuccess: true });
  } catch (err) {
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    // Find the admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    // Check if OTP is valid and if it has expired
    const isOtpValid = admin.otp === otp;
    const isOtpExpired = admin.otpExpires < Date.now();

    if (isOtpExpired) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please check and try again.",
      });
    }

    // Mark the admin as verified and clear OTP fields
    admin.verified = true;
    admin.otp = undefined;
    admin.otpExpires = undefined;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during OTP verification.",
    });
  }
};

// reset admin password request [OTP] send
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Find the admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    // Check if the admin's account is verified


    // Generate OTP and set expiration time
    const otp = crypto.randomInt(10000, 99999).toString();
    admin.setOtp(otp);
    await admin.save();

    // Send OTP email
    await sendEmail(email, "Password Reset Request", generatePasswordResetEmail(email, otp));

    return res.status(200).json({
      success: true,
      message: "Password reset email sent successfully.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the password reset request.",
    });
  }
};

//  Verify OTP and reset Admin Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required.",
      });
    }

    // Find the admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    // Check if the OTP is expired
    if (admin.otpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // Check if the OTP is valid
    if (admin.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // Set the new password
    admin.password = newPassword;
    admin.otp = undefined;
    admin.otpExpires = undefined;

    await admin.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during password reset.",
    });
  }
};

// manage the commison
export const addcommison = async (req, res) => {
  const { commission } = req.body;
  const id = req.id;

  try {
    let checkid = await Admin.findOne({ _id: id });
    if (checkid) {
      checkid.commission = commission;
      await checkid.save();
      return res.status(200).json({ message: "successfully added", isSuccess: true });
    } else {
      return res.status(404).json({ message: "user not found", isSuccess: false });
    }
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message, isSuccess: false });
  }
};



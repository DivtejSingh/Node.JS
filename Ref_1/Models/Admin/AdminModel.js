import mongoose from "mongoose";
import bcrypt from "bcrypt";



// Define the Admin schema
const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
  },
  password: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  commission: {
    type: String, // Correct reference to Decimal128
    
  },
  role:{
    type:String,
    default:"admin"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
},{timestamps: true});

// Pre-save middleware to hash the password
// Method to set the OTP and its expiration time
adminSchema.methods.setOtp = function (otp) {
  this.otp = otp;
  this.otpExpires = Date.now() + 15 * 60 * 1000; // 15 minutes from now
};

// Method to check if the OTP is still valid
adminSchema.methods.isOtpValid = function (otp) {
  return this.otp === otp && this.otpExpires > Date.now();
};

// Create and export the Admin model
export const Admin = mongoose.model("Admin", adminSchema);

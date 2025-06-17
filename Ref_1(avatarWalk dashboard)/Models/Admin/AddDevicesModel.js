import mongoose from "mongoose";

// Define the Device schema
const deviceSchema = new mongoose.Schema({
  deviceType: {
    type: String,
    enum: ['iphone', 'android'], // Define allowed device types
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Create and export the Device model
export const Device = mongoose.model("Device", deviceSchema);

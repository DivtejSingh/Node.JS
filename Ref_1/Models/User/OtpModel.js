import mongoose from 'mongoose';
const Otpschema = new mongoose.Schema(
    {
   userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true,
   },
   otp:{
    type:Number,
    required:true,
   },
   createdAt: { type: Date, default: Date.now, expires: 600 }
},{timestamps: true})

export const Otp = mongoose.model('Otp',Otpschema);
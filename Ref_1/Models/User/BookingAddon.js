import mongoose from "mongoose";

const bookingAddonSchema  = new mongoose.Schema({
 meetingId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Meeting'
 },
 prevDuration:{
    type:Number
 },
 addDuration:[{
    type:Number
 }],
 Totalduration:{
    type:Number
 },
 currentDuration:{
   type:Number
 },
 event_id:{
    type:String
 },

 price:{
    type:Number
 },
 paymentStatus:{
    type:String
 },
 reqId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Request"
 },
 SessionId:{
   type:String
 }



},{timestamps:true})

export const BookingAddon = mongoose.model("BookingAddon",bookingAddonSchema); 
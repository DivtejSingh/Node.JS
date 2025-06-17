import mongoose from "mongoose";
const avatarRatingSchema = new mongoose.Schema({
 userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
 
 },
 avatarId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
 },
 Comments:{
    type:String,
    
 },
 rating:{type:Number},
 avgRating:{
    type:String
 }

},{timestamps: true});

export const AvatarRating = mongoose.model('AvatarRating',avatarRatingSchema);

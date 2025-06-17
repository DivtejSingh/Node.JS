import mongoose from "mongoose";
const userProfileSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    role:{
        type:String,
        enum:['user','avatar']
    },
 
 
    usercommission:{
        type:Number,
      
    },
    avatarcommission:{
        type:Number,
       
    }

},{timestamps: true})

export const userProfile = mongoose.model('userProfile',userProfileSchema);
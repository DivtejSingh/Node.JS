import mongoose from "mongoose";
import { Experience } from "../Avatar/ExperienceModel.js";
const historySchema  = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    userName:{
        type:String,

    },
    avatarId:{
         type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    avatarName:{
        type:String
    },
    experienceId:{
     type:mongoose.Schema.ObjectId,
     ref:'Experience'
    },
    experienceName:{
        type:String
    },

 // Succeed ,failed,
   paymentStatus:{
        type:String,
    },
    // cancelled , booked , completed,requested
    experienceStatus:{
        type:String
    },
    rating:{
        type:Number,
    },
    comments:{
        type:String
    },
    ammount:{
        type:Number
    },
    refunds:{
        type:Number
    },
    refundStatus:{
        type:String
    },
    meetingStatus:{
        type:String
    },
    errorCode:{
        type:String
    },
    errormsg:{
        type:String
    },
    errorthrow:{
        type:String
    },
    action:{
        type:String
    },
    id:{
        type:String
    }




},{timestamps:true})

export const History = mongoose.model('History',historySchema);
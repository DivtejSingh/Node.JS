import mongoose from "mongoose";
const mobileSchema = new mongoose.Schema({
    avatarId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    device:{
        type:String
    },
    glimble:{
        type:Boolean
    }

},{Timestamp:true});

export const  MobileDevices = mongoose.model("MobileDevices", mobileSchema);
import mongoose from "mongoose";


const tourSchema  =new mongoose.Schema({
    avatarId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'avatar'
    },
    totaltours:{
        type:Number,
        required:true,
        default:0
    },
    canceltour:{
        type:Number,
        required:true,
        default:0
    },
    todaytour:{
        type:Number,
        required:true,
        default:0
    }
    


},{timestamps: true})
export const Tour = mongoose.model("Tour",tourSchema);
import mongoose from "mongoose";

const avathonsbookingschema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    userName:{
        type:String,
        trim:true
    },
    avatrId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    avatarName:{
     type:String,
     trim:true
    },
    avathonId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Avathons'
    },
    avathonTime:{
        type:Date
    },
    avathonDate:{
        type:Date
    },
    avathonPrice:{
        type:Number
    },
    Paystatus:{
        type:Number,
        enum:[0,1],
        default:0
    },
    avathonStatus:{
        type:String
    },EarlybirdPrice:{
        type:String
    }


})

export const avathonBook = mongoose.model("avathonBook",avathonsbookingschema);
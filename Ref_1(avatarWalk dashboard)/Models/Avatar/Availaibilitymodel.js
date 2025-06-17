import mongoose, { mongo } from "mongoose";

const availaibilitySchema = new mongoose.Schema({
    avatarId:{
         type:mongoose.Schema.Types.ObjectId,
         ref:'User'
         
    },

    from:{
        type:Date,
        required:true
    },
    to:{
        type:Date,
        required:true,
    },

    timeZone:{
        type:String,
       
    },
    timeahead:{
        type:String
    }

},{timestamps: true})

export const Available = mongoose.model('Available',availaibilitySchema) 
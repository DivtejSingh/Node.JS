import mongoose from "mongoose";
const AccountInfoSchema = new mongoose.Schema({
    userID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    StripeEmail:{
        type:String,
    },
    StripeId:{
        type:String,
    },
    totalAmmount:{
    type:String,
    }
    

},{timestamps: true})
export const UserAccInfo = mongoose.model('UserAccInfo',AccountInfoSchema)
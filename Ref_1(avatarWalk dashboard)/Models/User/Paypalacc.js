import mongoose from "mongoose";
const paypalSchema = new mongoose.Schema({
    userId:{
         type:mongoose.Schema.Types.ObjectId,
         ref:'User',
         required:true
    },
    paypalEmail:{
        type:String

    },
    paypalName:{
        type:String
    }
},{timestamps:true})
export const PaypalAcc = mongoose.model('PaypalAcc',paypalSchema);
import mongoose from "mongoose";
const addAccountSchema = new mongoose.Schema({
    UserID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },

    stripeEmail:{
        type:String,
        required:true
    },
    stripeAccountId:{
        type:String
    },
    country:{
        type:String
    }

},{timestamps: true})
export const Addacc = mongoose.model('Addacc',addAccountSchema);
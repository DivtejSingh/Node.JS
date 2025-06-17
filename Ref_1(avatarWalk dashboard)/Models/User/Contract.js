import mongoose from 'mongoose';
const contractSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    AvatarId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    status:{
        type:String,
        enum:['Active','Completed','Dispute','Refund','Pending']
    }, 
    Cancelledby:{
        type:String,
        enum:["user","avatar"]

    },
    PaymentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Payment'
    },
    SessionId:{
        type:String
    },
    paymentIntentId:{
        type:String
    }

},{timestamps: true});

export const Contract = mongoose.model("Contract",contractSchema);
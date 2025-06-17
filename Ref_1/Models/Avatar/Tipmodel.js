import mongoose from 'mongoose'

const tipSchema = new mongoose.Schema({
    from:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    to:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    bookingId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Booking'
    },
    Date:{
        type:Date
    },
    SessionId:{
        type:String
    },
    currency:{
        type:String
    },
    status:{
        type:String
        
    },
    paymentType:{
        type:String
    },
    tip:{
       type:Number
    },
  payerId:{
    type:String
  }
    



})

export const Tip = mongoose.model('Tip',tipSchema);
import mongoose from "mongoose";

const refundSchema = new mongoose.Schema({
    bookingId:{
         type:mongoose.Schema.Types.ObjectId,
        ref:"Booking"
    },
    bookingRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true
  },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',  // Assuming you want to reference the payment record
       
      },
      paymentIntentId:{
      type:String,
      },
      amount: {
        type: Number,
          // Refund amount in the currency's smallest unit (e.g., cents)
      },
      status: {
        type: String,
        
        default:'Pending'
      },
   
    reason:{
        type:String,
         
    },
    Cancelledby:{
        type:String,
        default:"avatar"
    }
    ,currency: {
      type: String,
    
    },
    arrivalDate: {
      type: Date,
      required: false,
  
    },
    refundId:{
      type:String,
      
    },
    chargeID:{
      type:String
    }
  ,
    refunddata:{
      type:Object
    },
    receipturl:{
      type:String
    }

    

},{timestamps: true})

export const Refund = mongoose.model('Refund',refundSchema);
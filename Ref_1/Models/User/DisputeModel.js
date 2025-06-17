import mongoose from "mongoose";

const DisputeSchema = new mongoose.Schema({
    bookingRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Request",
        required: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',  // Assuming you want to reference the payment record
       
      },
      sessionId:{
        type:String
      },
      paymentIntentId:{
        type:String,
        },
    reason: {
        type: String,
       
    },
    disputeId:{
        type:String,
        
      },
   
      status: {
        type: String,
        default:'Pending'
      
      },
    Cancelledby: {
        type: String, 
        default:"user" // You might want to use an enum or a more specific type if possible
     
    },
    receipturl:{
      type:String
    },
    amount: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
      
      },

      disputedata:{
        type:Object
      }
},{timestamps: true});

export const Dispute = mongoose.model('Dispute', DisputeSchema);

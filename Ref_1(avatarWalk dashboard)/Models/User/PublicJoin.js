import mongoose from 'mongoose';

const publicJoinScehma = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
       
    },
    avatarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Adjust 'User' if there's a specific model for avatars
       
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        
    },
    packageId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experience',
        
    },
    price: {
        type: Number,
        // Total price paid by the user
    },
    totalprice: {
        type: Number,
          // Amount that goes to the avatar
    },
    adminFee: {
        type: Number,
        // Amount that goes to the admin
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    SessionId:{
    type:String
    },
    paymentIntentId: {
        type: String,
        
    },
    paymentMethodId: {
        type: String,
        
    },
    stripeChargeId: {
        type: String,
    },
    receiptUrl: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Succeeded', 'Pending', 'Failed','Disputed','Refunded'],
        
        default: 'Pending'
    },
    currency: {
        type: String,
       
        
    }
    ,paymentType:{
        type:String,
    }

    ,payerId:{
        type:String
    },
    paymentdata:{
        type:Object
    },
    captureId:{
        type:String
    },
    meetingId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Meeting'
    },
    room_id:{
        type:String
    }

},{timestamps: true});

export const PublicJoin = mongoose.model('PublicJoin', publicJoinScehma);

import mongoose from 'mongoose';

const avathonPaymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        
    },
    avatarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Adjust 'User' if there's a specific model for avatars
       
    },
    avathonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Avathon',
       
    },
    price: {
        type: Number,
        
    },
    avatarWalkFee: {
        type: Number,
          // Amount that goes to the avatar
    },
    adminFee: {
        type: Number,

    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    totalprice:{
        type:Number
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
        enum: ['Succeeded', 'Pending', 'Failed','Disputed','Refunded','Created'],
        
        default: 'Pending'
    },
    currency: {
        type: String,
       
        default: "inr"
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
    bookiId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'avathonBook'
    }

},{timestamps: true});

export const avathonPayment = mongoose.model('avathonPayment', avathonPaymentSchema);

import mongoose from 'mongoose'

const transactionsSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    RefundCommision: {
        type: Number,
        default:0
    },
    PaymentId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    }],
    TourPrice: [Number],
    totalEarning: {
        type: String,
        default:0
    },

    Date: {
        type: Date,
        default: Date.now
    },
    avatarcommision:{
        type:Number,
        default:0
    },
    Tip:{
        type:Number,
        default:0
    },
    publicJoin:{
        type:Number,
        default:0
    },
    OfferPrice:{
        type:Number,
        default:0
    },
    addmoreTime:{
        type:Number,
        default:0
    },
    Method:{
        type:String,
        enum:['stripe','paypal']
    }

}, { timestamps: true });

export const Account = mongoose.model('Account',transactionsSchema );

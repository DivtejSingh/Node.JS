import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    avatarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Make sure this is the correct reference
        required: true
    },
    packageIds: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experience'
    },
    bookingDate: {
        type: Date,
        required: true
    },
    bookingTime: {
        type: Date,
        required: true
    },
    Duration: {
        type: Number,
       // Store duration in minutes
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Requested', 'Booked', 'Cancelled', 'Completed'],
        default: 'Requested'
    },
    tourType: {
        type: String,
        enum: ['Public', 'Private'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expstatus:{
        type:Number,
        enum:[0,1],
        default:0
    },
    PaymentintendId:{
        type:String,
    },
    reqId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Request'
    },
    payStatus:{
        type:Number,
        default:0
    },
    TimeString:{
        type:String
    },
    amountPerminute:{
        type:Number
    },
    cancel:{
        type:Number,
        enum:[0,1],
        default:0
    }




},{timestamps: true});

// Ensure indexes for faster querying
bookingSchema.index({ avatarId: 1, bookingDate: 1, bookingTime: 1 });

bookingSchema.pre('save', function(next) {
    // Calculate endTime based on bookingTime and Duration
    this.endTime = new Date(this.bookingTime.getTime() + this.Duration * 60000); // Duration in minutes
    next();
});

export const Booking = mongoose.model("Booking", bookingSchema);

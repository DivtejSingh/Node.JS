import mongoose from 'mongoose';

const tourSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    avatarId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    bookingId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Booking'
    },
    reqId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Request'
    },
    ExpId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Experience'
    },
    tourType:{
        type:String,
        enum:['Public','Private']
    },

    addExtraDuration:{
        type:Number,

    },
    BookingDate:{
        type:Date
    },
    BookingTime:{
        type:Date
    },
    Duration:{
        type:Number
    },
    endTime:{
        type:Date
    },
    PaymentStatus:{
        type:String,
       
    },
    SessionId:{
        type:String,
    },
    instantlive:{
        type:Boolean
    },
    roomId:{
        type:String
    },
    Bookings:{
        type:Number
    },
    AmountPerMinute:{
        type:Number
    },
    Status:{
        type:String,
        default:"Active"
    },
    Start:{
        type:Number,
        enum:[0,1],
        default:0
    }





},{timestamps:true})

export const TourInfo = mongoose.model('TourInfo',tourSchema);
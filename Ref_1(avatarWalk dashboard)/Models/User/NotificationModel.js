import mongoose from "mongoose";


const notificationSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    Message:{
        type:Boolean,
        enum:[true,false],
        default:true,
    },
    Approvedtour:{
        type:Boolean,
        enum:[true,false],
        default:true,

    },
    CancelledTour:{
        type:Boolean,
        enum:[true,false],
        default:true,
    },
    NewTour:{
        type:Boolean,
        enum:[true,false],
        default:true,
    },
    Support:{
        type:Boolean,
        enum:[true,false],
        default:true,
    },
    NotificationOffer:{
        type:Boolean,
    }
})

notificationSchema.index({ userId: 1 });

export const Notification = mongoose.model("Notification",notificationSchema);
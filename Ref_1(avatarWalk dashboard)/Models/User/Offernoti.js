import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema({
    avatarID:{
         type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    offer:{
        type:Boolean,

    }
})

export const notifi = mongoose.model('notifi',notificationSchema);
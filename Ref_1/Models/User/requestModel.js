import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
 
    },
    avatarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'avatar',
       
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        
    },
    packageId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experience',
      
    },
    status:{
       type:String,
       enum: ['Requested', 'Booked', 'Cancelled', 'Completed'],
   
    },
    Cancelledby:{
      type:String,
      enum:['avatar','user']
    
    },
    createdAt: {
        type: Date, 
        default: Date.now
    },
  
},{timestamps: true});

export const Request = mongoose.model('Request', requestSchema);

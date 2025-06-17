import mongoose from 'mongoose';
const meetingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
       
      },
      AvatarID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      
      },
      ReqId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request',
      
       
      },
      endTime:{
        type:Date,
     
      },

    link:{
        type:String,

    }

    ,
    linkSent:{
      type:Boolean,
      
    },
    startTime:{
        type:Date,
        required:[true,'start time is required']
    },
    duration:{
        type:Number,
       
     
    },
    eventId:{
        type:String,
    

    },
    status:{
  type:String,
    },
    bookingId:{
      type:String
    },
    PaymentId:{
      type:String
    },
    joiners:[{
       type:mongoose.Schema.Types.ObjectId,
       ref:'User'     
    }],
    tourtype:{
      type:String
    },
    ExpId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Experience"
    },
    price:{
      type:Number
    },
    createdAt: { type: Date, default: Date.now}
    


},{timestamps: true})

export const Meeting  = mongoose.model("Meeting",meetingSchema);

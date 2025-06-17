import mongoose from 'mongoose';

const avathonmeetingSchema = new mongoose.Schema({
    avatarId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    avathonId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Avathon'
    },
    userId:[
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
    avathonTime:{
        type:Date,
    },
    roomId:{
        type:String
    }
})


export const avathonmeeting = new mongoose.Schema('avathonmeeting',avathonmeetingSchema);
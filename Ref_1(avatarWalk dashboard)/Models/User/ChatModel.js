import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',

  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
  
  },
  message: {
    type: String,
    required: true
  },
  parentMessage:{
   type:mongoose.Schema.Types.ObjectId,
   ref:'Chat'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  },
  delete:{
    type:Number,
    default:0

  },
  status:{  
    type:String,
    enum:['sent','sending','seen'],
    default:'sending'
  }
},{timestamps: true});

export const Chat = mongoose.model('Chat', ChatSchema);



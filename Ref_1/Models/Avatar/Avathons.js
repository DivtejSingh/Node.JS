import mongoose from 'mongoose';
const avathonsSchema = new mongoose.Schema({
    avatarId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"

    },
    avatarName:{
        type:String,
        trim:true
    },
    avataremail:{
    type:String,
    trim:true
    },
    avatarImage:{
        type:String,
    },

    avathonTitle:{
        type:String,

    },
    avathonDescription:{
       type:String
    },
    Country:{
        type:String,
        trim:true
    },
    City:{
      type:String,
      trim:true
    },
    State:{
        type:String,
        trim:true
    },
    avathonPrice:{
        type:String,
        trim:true
    },
    avathonHours:{
        type:String,
        trim:true
    },
    avathonDate:{
        type:Date,

    },
    avathonTime:{
        type:Date
    },
    EarlybirdPrice:{
        type:String,
    },
    avathonsThumbnail:{
        type:String
    },
    avathonsImage:[{
    type:String

    }],
    avathonsStatus:{
      type:String,
      enum:['In Review','Accepted','Rejected'],
      default:'In Review'
    },
    avatarApproved:{
        type:Boolean,
        enum:[true,false],
        default:false
    },
    Availablespots:{
        type:Number,
        default:0
    },
    endEvent:{
        type:Date,
        index: { expireAfterSeconds: 0 }
       
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status:{
        type:Number,
        default:0
    },
    joinedMembers:{
        type:Number,
        default:0
    },
    Eighteenplus:{
     type:Boolean,
     default:false
    },
    aboutStream:{
        type:String
    },
    deleteAvathons:{
        type:Number,
        enum:[0,1],
        default:0,
    },
    type:{
       type:String,
       default:"Avathons" 
    },
    RejectReason:{
         type:String
    },
    lat:{
        type:String
    },
    lng:{
type:String
    },
     Reviews:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'avRating'
  
      }],
      rating:[{
        type:Number,
        default:0
      }],
      avgRating:{
        type:Number,
        default:0
      },
    roomId:{
        type:String
    },
   

},{timestamp:true})

avathonsSchema.index({ endEvent: 1 }, { expireAfterSeconds: 0 });

export const Avathons = mongoose.model('Avathons',avathonsSchema);

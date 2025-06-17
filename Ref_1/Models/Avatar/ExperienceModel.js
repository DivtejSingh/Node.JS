import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema({
    avatarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    avatarImage:{
      type:String,
    },
    about:{
      type:String,
      required:true
    },
    avatarName:{
    type:String,
    required:true
    },
    images: [{
        type: String,
        required: true
    }],
    thumbnail:{
         type:String,

    },
    ExperienceName: {
        type: String,
        required: true
    },
    AmountsperMinute:{
      type:Number,
      required:true
    },
   country: {
        type: String,
        required: true
    },
   State: {
        type: String,
        default:''
    },
    city: {
        type: String,
        default:''

    },
    notesForUser:{
       type:String,
       required:true
    },
    status:{
      type:Number,
      enum:[0,1],
      default:0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    Reviews:[{
      type: mongoose.Schema.Types.ObjectId,
      ref:'Rating'

    }],
    Booking:{
      type:Number,
      default:0

    },
    likes:{
      type:Number,
      default:0,

    },
    rating:[{
      type:Number,
      default:0
    }],
    isFeatured:{
      type:Boolean,
      enum:[true,false],
      default:false

    },
    avgRating:{
      type:Number,
      default:0
    },
    bookinstaltly:{
      type:Boolean,
      default:false
    },
    reportExp:[{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Report'
    }],
    lat:{
      type:Number,
    
    },
    lng:{
      type:Number,
  
    }
    


    
},{timestamps: true});

export const Experience = mongoose.model('Experience', experienceSchema);

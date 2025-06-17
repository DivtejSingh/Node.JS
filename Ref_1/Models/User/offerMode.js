import mongoose from "mongoose";


const offerSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
         ref:'user',
         require:[true,'User is required']
         
    },
    userName:{
        type:String,
        required:true
    
    },
   
    Title:{
        type:String,
        required:[true,"title is required"]
    },
    Price:{
        type:Number,
        required:[true,"Price is required"]
    },
    Minutes:{
        type:Number,
        required:[true,"Time is required"]
    },
    Country:{
        type:String,
        required:[true,"Country is required"]
    },
    City:{
        type:String,
       

    },
    State:{
        type:String,
        
    },
    ZipCode:{
        type:Number,
        required:[true,"Zip code is Required"]

    },
    Notes:{
        type:String,
        required:[true,"Notes is required"]
    },
    status:{
        type:String,
        enum: ['Accepted', 'Cancelled', 'Completed','Pending'],
        default:'Pending'
    },
    lat:{
        type:Number,

    },
    lng:{
       type:Number 
    },
    Type:{
    type:String,
    enum:["Offers"],
    default:"Offers"
    },  
    location: {
        type: {
          type: String,
          enum: ['Point'], // GeoJSON type must be "Point"
          default: 'Point'
        },
        coordinates: {
          type: [Number], // Array of numbers [longitude, latitude]
          required: true
        }
      },
   avatarId:{
    type:mongoose.Schema.ObjectId,
    ref:'User'
   },
   Date:{
    type:Date
   },
   Time:{
    type:Date
   },
 endTime:{
    type:Date
 },
 adminFee:{
    type:Number
 },
 paymentIntentId:{
    type:String
 },
 paystatus:{
    type:String
 }

    
},{timestamps: true})
offerSchema.index({ location: '2dsphere' });

export const Offer = mongoose.model('Offer',offerSchema);
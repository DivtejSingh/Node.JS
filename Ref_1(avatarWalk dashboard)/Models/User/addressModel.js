import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    country: {
        type: String,
        required: [true,"Country is required"]
    },
    city: {
        type: String,
       
    },

    State:{
      type:String,
     
    },
    zipCode: {
        type: Number,
        required: [true,"zip Code is required"]
    }
    ,status:{
        type:Number,
        enum:[0,1],
        default:0
    },
    profileimage:{
        type:String,
       
    },
    firstName:{
        type:String,
      
    },
    lastName:{
        type:String,
        
    },
    mobileNumber:{
        type:String,
      
    },
    dob:{
        type:Date,
        
    },
    about:{
        type:String
    },
    lat:{
        type:Number
    },
    lng:{
        type:Number
    },
    description:{
        type:String
    },
    code:{
        type:String
    }

},{timestamps: true});

export const Address = mongoose.model("Address", addressSchema);

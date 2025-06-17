import mongoose from "mongoose";


const multipleaddressSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    Country:{
        type:String,
    },
    State:{
        type:String
    },
    City:{
        type:String
    },
    Zipcode:{
        type:Number
    },
    town:{
        type:String
        
    },
    lat:{
        type:Number
    },
    long:{
        type:Number
    }


},{timestamps:true}
)

export const multipleAdd  = mongoose.model("multipleAdd",multipleaddressSchema);
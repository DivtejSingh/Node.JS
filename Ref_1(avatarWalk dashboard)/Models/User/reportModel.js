import mongoose from "mongoose";


const ReportSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    avatarId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    packageId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Experience"
    },
    SexualContent:{
        type:Boolean ,
        enum:[true,false],
      
    
    },
    
    VoilentContent:{
        type:Boolean ,
        enum:[true,false],
  
    
    },
   AbusiveContent:{
    type:Boolean ,
    enum:[true,false],
 
    
    },
    DangerousContent:{
        type:Boolean ,
        enum:[true,false],
      
    
    },
    SpamContent:{
        type:Boolean ,
        enum:[true,false],
    
    
    }
 

},{timestamps: true})

export const Report = mongoose.model('Report',ReportSchema);
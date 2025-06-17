import mongoose from "mongoose";




const profileSchema = new mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    profileimage:{
        type:String,
        required:[true,'profile image is required']
    },
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    mobileNumber:{
        type:String,
        required:true
    },
    dob:{
        type:Date,
        required:true
    },
    Country:{
        type:String,
        required:true
    },
    City:{
        type:String,
        required:true
    }



},{timestamps: true})
profileSchema.index({ location: '2dsphere' });
export const Profile = mongoose.model('Profile',profileSchema);
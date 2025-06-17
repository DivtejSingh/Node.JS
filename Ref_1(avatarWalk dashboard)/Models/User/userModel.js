import mongoose from 'mongoose';




const userSchema = new mongoose.Schema({
    userName: {
        type: String,
      
       
     
        trim:true
    },
    email: {
        trim:true,
        type: String,
        required: true,
      
        match: [/^\S+@\S+\.\S+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        // required: [true, 'Password is required'],
        // minlength: [8, 'Password must be at least 8 characters long'],
      
    },
    confirmPassword: {
        type: String,
        // required: [true, 'Confirm password is required'],
       
    },
    terms:{
        type:String,
    
    },
    uid:{
        type:String

    },
    //status for delete the account or not if 0 then account is active and if the status is 1 then account is  deleted 2 for freeze
    //status 0 for active account
    //satus 1 for delete account
  
    status:{
        required:true,
        type:Number,
        enum:[0,1],
        default:0

    },
    block:{
        required:true,
        type:Number,
        enum:[0,1],
        default:0
    },
    Freeze:{
        required:true,
        type:Number,
        enum:[0,1], 
        default:0
    },
    // 0 for offline 1 for onlie

Online:{
    type:Boolean
   
},
Activeprofile:{
    type:String,
    enum:   ['user','avatar']
    
    
},
action:{
    type:String,    
    enum:['login','registration']
},
isAvatarApproved: {
    type: Boolean
},
reportAvatar:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'ReportAvt'
}],
profileimage:{
    type:String,
},
isgoogleSignup:{
    type:Boolean,
    default:false
},
isAppleSignup:{
    type:Boolean,
    default:false
},
isEmailsignup:{
    type:Boolean,
    default:false
},
lastActive:{
    type:String
},
Viewpassword:{
    type:String
}
},{timestamps: true});

export const User = mongoose.model('User', userSchema);

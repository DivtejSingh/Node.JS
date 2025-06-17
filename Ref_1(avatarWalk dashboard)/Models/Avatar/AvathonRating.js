import mongoose from 'mongoose';


const ratingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
 AvathonId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Avathon'
 },
 userImage:{
    type:String,

 },
 userName:{
    type:String,
 },
  avatarId:{
    type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
  },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true
    },
    AmmountTip:{
       type:String,
   
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
},{timestamps: true});

export const avRating = mongoose.model('avRating', ratingSchema);

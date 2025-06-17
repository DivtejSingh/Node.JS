import mongoose from 'mongoose'
import { Avatar } from './avatarModel'

const earningSchema = new mongoose.Schema({
    avatarId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    withdrawBalance:{
      type:Number,
      required:true,
      default:0
    },
  
     day:{
        type:String,
        required:true,
        enum:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
     },
 
    amount:{
        type:Number,
        required:true,
        default:0
     },

    totalEarning:{
        type:Number,
        required:true,
        default:0
    },
    earningthismonth:{
        type:Number,
        required:true,
        default:0
    },
    upcomingexperience:{
        type:Number,
        required:true,
        default:0
    },
    completeTours:{
        type:Number,
        required:true,
        default:0
    },
    averageExpchr:{
        type:Number,
        required:true,
        default:0
    },


    todayearning:{
       type:Number,
       required:true,
       default:0

    }



},{timestamps: true})

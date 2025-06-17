import mongoose from "mongoose";
import { Experience } from "./ExperienceModel";

const instantLiveSchema = new mongoose.Schema({
 from:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
 },
 to:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
 },
 status:{
    type:String,
    enum:['Requested','Completed','Cancelled']
 },
 ExperienceName:{
  type:String


 }

})

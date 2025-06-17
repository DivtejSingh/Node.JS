import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true }, // Reference to User or avatar
    
    lat:{
      type:Number,
      required:true,
    },
    lng:{
      type:Number,
      required:true
    }

  },{timestamps: true});
  
  
  // Compile and export the model
  export const Location = mongoose.model('Location', locationSchema);
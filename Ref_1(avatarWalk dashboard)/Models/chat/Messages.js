import mongoose from "mongoose";

const messagesSchema = mongoose.Schema({
  conversationId: {
    type: String,
    require: true,
  },
  senderId: {
    type: String,
  },
  time:{
    type:String
  },
  timezone:{
    type:String
  },

  message: {
    type: String,
  },
},{timestamps: true});

export const Messages = mongoose.model("Messages", messagesSchema);

// module.exports = Messages;

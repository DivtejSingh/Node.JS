import mongoose from "mongoose";

const conversationSchema = mongoose.Schema({
  members: {
    type: [String],
    require: true,
  },
},{timestamps: true});

export const Conversation = mongoose.model("Conversation", conversationSchema);

// module.exports = Conversation;
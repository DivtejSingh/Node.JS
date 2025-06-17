
import { User } from "../../Models/User/userModel.js";

import { Chat } from "../../Models/User/ChatModel.js";


export const sendMessage = async (req, res) => {
    const{_id} = req.user;
    const {id} = req.params;
    const { message, read, status } = req.body;
    try {
      const chat = new Chat({
        sender:_id,
        receiver:id,
        message:message,
        read,
        status
      });
      await chat.save();
      res.status(201).json({ chat, isSuccess: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message, isSuccess: false });
    }
  };
  
  // Edit a message
  export const editChat = async (req, res) => {
    //Chat id
    const { id } = req.params;
    const { message} = req.body;
    try {
      const chat = await Chat.findByIdAndUpdate(
        id,
        { message},
        { new: true }
      );
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found', isSuccess: false });
      }
      res.status(200).json({ chat, isSuccess: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message, isSuccess: false });
    }
  };
  
  // Delete a message
  export const deleteChat = async (req, res) => {
    const { id ,status} = req.params;

    try {
      const chat = await Chat.findByIdAndUpdate(
        id,
        { delete:status},
        { new: true }
      );
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found', isSuccess: false });
      }
      res.status(200).json({ message:"Chat deleted",chat, isSuccess: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message, isSuccess: false });
    }
  };

  
  // Reply to a message
  export const replyChat = async (req, res) => {
    const { id } = req.params;
    const { _id } = req.user;
    const { message } = req.body;
    try {
      const parentChat = await Chat.findById(id);
      if (!parentChat) {
        return res.status(404).json({ message: 'Parent chat not found', isSuccess: false });
      }
      const reply = new Chat({
        sender:_id,
        receiver: parentChat.sender, // Assuming replying to the sender of the original 
        message,
        parentMessage: parentChat._id,
   
      });
      await reply.save();
      res.status(201).json({ reply, isSuccess: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message, isSuccess: false });
    }
  };

  // export const getchat = async(req,res)=>{
  //   const{_id} = req.user;
  //   const {}
  // }
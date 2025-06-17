import { Conversation } from "../../Models/chat/conversation.js";
import { Messages } from "../../Models/chat/Messages.js";
import { User } from "../../Models/User/userModel.js";
import { messageNotification } from "../../services/CreateEmail.js";
import { sendEmail } from "../../services/EmailServices.js";

// /api/conversation   / post method
export const ChatConversationApi = async (req, res) => {
  try {
  
    const { senderId, receiverId } = req.body;
    const newConversation = new Conversation({ members: [senderId, receiverId] });
    await newConversation.save();
    res.status(200).send("conversation created successfully");
  } catch (error) {
    console.log(error);
  }
};

// "/api/conversation/:userId"    / get method
export const ChatConversationGetByUserIdApi = async (req, res) => {
  try {
    const userId = req.params?.userId;
    const conversation = await Conversation.find({ members: { $in: [userId] } });
    const conversationUserData = Promise.all(
      conversation.map(async (conversations) => {
        const receiverId = conversations.members.find((member) => member !== userId);
        const user = await User.findById(receiverId);
        return { user: { receiverId: user?._id, email: user.email, userName: user.userName }, conversationId: conversations._id };
      })
    );
    res.status(200).json(await conversationUserData);
  } catch (error) {
    console.log(error);
  }
};

//  /api/message    / post method    / message bejne ke liye
export const ChatMessageApi = async (req, res) => {
  try {
    const { conversationId, senderId, message, receiverId = "" } = req.body;
    // console.log(req.user.email)
    const{email}=req.user
    if (!senderId || !message) {
      return res.status(400).send("please fill all required fields");
    }
    if (conversationId === "new" && receiverId) {
      const newConversation = new Conversation({ members: [senderId, receiverId] });
      await newConversation.save();
      const newMessage = new Messages({ conversationId: newConversation._id, senderId, message });
      await newMessage.save();
      return res.status(200).send("message send successfully");
    } else if (!conversationId && !receiverId) {
      return res.status(400).send("please fill all required fields");
    }
    const newMessage = new Messages({ conversationId, senderId, message });
    await newMessage.save();
    res.status(200).send({ message: "message sent succesfully", data: newMessage });
  } catch (error) {
    console.log(error);
  }
};

// /api/message/:conversationId    / get method  / chat get krne ke liye
export const ChatMessageGetByConversationIdApi = async (req, res) => {
  try {
    const conversationId = req.params.conversationId;

    const checkMessages = async (conversationId) => {
      // Fetch messages for the provided conversationId
      const messages = await Messages.find({ conversationId });

      // Map over the messages to include user details
      const messageData = await Promise.all(
        messages.map(async (message) => {
          const user = await User.findById(message.senderId);
          return { user: { id: user._id, email: user.email, userName: user.userName }, message: message.message,Time:message.createdAt,time:message.time,timezone:message.timezone };
        })
      );

      // Send response with conversationId and messages
      res.status(200).json({ isSuccess: true, conversationId, messages: messageData });
    };

    if (conversationId === "new") {
      // If the conversationId is "new", find an existing conversation
      const checkConversation = await Conversation.find({ members: { $all: [req.query.senderId, req.query.receiverId] } });

      if (checkConversation.length > 0) {
        // Fetch messages for the existing conversation
        checkMessages(checkConversation[0]._id);
      } else {
        // If no conversation found, respond with an empty array
        res.status(200).json({ isSuccess: true, conversationId, messages: [] });
      }
    } else {
      // Fetch messages for the existing conversation
      checkMessages(conversationId);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ isSuccess: false, error: "An error occurred while fetching messages" });
  }
};



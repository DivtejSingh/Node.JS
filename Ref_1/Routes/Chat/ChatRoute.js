
import express from 'express';
import { ChatConversationApi, ChatConversationGetByUserIdApi, ChatMessageApi, ChatMessageGetByConversationIdApi } from '../../Controllers/chatController/ChatController.js';
import { verifyToken } from '../../Middleware/Auth.js';

export const ChatRouter = express.Router();

ChatRouter.post("/api/conversation" , ChatConversationApi)
ChatRouter.get("/api/conversation/:userId" , ChatConversationGetByUserIdApi)
ChatRouter.get("/api/message/:conversationId" , ChatMessageGetByConversationIdApi)
// ChatRouter.post("/api/message" , ChatMessageApi)
ChatRouter.post("/api/message" ,verifyToken, ChatMessageApi)
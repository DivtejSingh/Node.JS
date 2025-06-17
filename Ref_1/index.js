import express from "express";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
import cluster from 'cluster';

import "dotenv/config";
import { connect } from "./Database/dbconfig.js";
import socketHandler from "./Controllers/Sockethandler/ChatSocket.js";

import { verifyToken } from "./Middleware/Auth.js";
import { userRouter } from "./Routes/User/userRoute.js";
import { avatarRouter } from "./Routes/Avatar/avatarRoute.js";
import { tipsuccess,publicjoinsuccess,addsuccess } from "./Controllers/User/PaymentController.js";
import ejs from "ejs";
import { User } from "./Models/User/userModel.js";
import { Chat } from "./Models/User/ChatModel.js";
import { adminRouter } from "./Routes/Admin/AdminRoute.js";

import { ChatRouter } from "./Routes/Chat/ChatRoute.js";
import { paymentwebhook ,paypalwebhook} from "./Controllers/User/Webhook.js";
import { paymentsuccess } from "./Controllers/User/PaymentController.js";
import Webhandler from "./Controllers/Sockethandler/Webhandler.js";
import AvathonsLive from "./Controllers/Sockethandler/AvathonsLive.js";
import { avathonPaymentsuccess } from "./Controllers/User/avathonController.js";

//constraints
const port = 3000;
const  app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
       methods: ["GET", "POST"],
    // Optional: Specify allowed methods
    credentials: true, // Optional: Allow credentials (cookies, authorization headers, etc.)
  },
});


let users = [];

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); 
  res.header("Access-Control-Allow-Credentials", "true"); 
  next();
});

app.use(cors());
io.on("connection", (socket) => {
  // console.log("user connected", socket.id);

  socket.on("addUser", (userId) => {
    const isUserExist = users.find((user) => user.userId === userId);
    if (!isUserExist) {
      const user = { userId, socketId: socket.id };
      users.push(user);
      io.emit("getUsers", users);
    }
  });

  socket.on("sendMessage", async ({ conversationId, senderId, message, receiverId }) => {
    const receiver = users.find((user) => user.userId === receiverId);
    const sender = users.find((user) => user.userId === senderId);
    if (!sender) {
      console.error(`Sender with ID ${senderId} not found`);
      return;
    }
    const user = await User.findById(senderId);
   
    const messageData = {
      senderId,
      message,
      receiverId,
      conversationId,
      user: { id: user._id, fullname: user.userName, email: user.email },
    };

    io.to(sender.socketId).emit("getMessage", messageData);

    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", messageData);
    }
  });

  socket.on("disconnect", () => {
    users = users.filter((user) => user.socketId !== socket.id);
    io.emit("getUsers", users);
  });
});
app.get("/publicsuccess",publicjoinsuccess)
app.get("/paysuccess",tipsuccess);
app.get("/success",paymentsuccess);
app.get("/avathonSuccess",avathonPaymentsuccess);
app.get("/payaddmoretime",addsuccess);
app.post("/paypalwebhook",express.json({type:"application/json"}),paypalwebhook);
app.post("/webhookaccount", express.raw({ type: "application/json" }), paymentwebhook);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("Public"));



socketHandler(io);
Webhandler(io);
AvathonsLive(io);

app.use("/user", userRouter);
app.use("/avatar", avatarRouter);
app.use("/admin", adminRouter);

app.use("/chat", ChatRouter);

app.get("/", (req, res) => {
  res.send("welcome to servers");
});



server.listen(port, () => {
  console.log(`listening on port ${port}`);
});

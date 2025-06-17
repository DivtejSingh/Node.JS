import express from "express";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from 'dotenv'
dotenv.config();
import { connect } from "./Database/dbconfig.js";
import socketHandler from "./Controllers/Sockethandler/ChatSocket.js";
import { userRouter } from "./Routes/User/userRoute.js";
import { avatarRouter } from "./Routes/Avatar/avatarRoute.js";
import { adminRouter } from "./Routes/Admin/AdminRoute.js";
import { ChatRouter } from "./Routes/Chat/ChatRoute.js";

import Webhandler from "./Controllers/Sockethandler/Webhandler.js";
import AvathonsLive from "./Controllers/Sockethandler/AvathonsLive.js";


//constraints
const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    // Optional: Specify allowed methods
    credentials: true, // Optional: Allow credentials (cookies, authorization headers, etc.)
  },
});




app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(cors({
  origin: "/"
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("Public"));


//socket initialization
socketHandler(io);
Webhandler(io);
AvathonsLive(io);
// api routes

app.use("/user", userRouter);
app.use("/avatar", avatarRouter);
app.use("/admin", adminRouter);
app.use("/chat", ChatRouter);


// server start
server.listen(port, () => {
  console.log(`listening on port ${port}`);
});

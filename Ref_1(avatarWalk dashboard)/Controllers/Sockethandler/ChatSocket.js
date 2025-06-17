import { Chat } from "../../Models/User/ChatModel.js";
import { User } from "../../Models/User/userModel.js";
import { Meeting } from "../../Models/User/MeetingModel.js";
import { sendEmail } from "../../services/EmailServices.js";
import moment from "moment-timezone";
import mongoose from "mongoose";
import { Experience } from "../../Models/Avatar/ExperienceModel.js";
import { meetingStartNotificationEmail } from "../../services/CreateEmail.js";
const onlineUsers = new Map();

const instantLive = new Map();
const chatuser = new Map();
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const currentTime = moment().tz(userTimeZone).format();

const socketHandler = (io) => {
  io.on('connection', async(socket) => {
    const userId = socket.handshake.query.user || " ";
    socket.userId=userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid or missing userId:', userId);
      return; // Do not proceed if the userId is invalid
  }
  try {


    // Update lastActive and set Online status
    let user = await User.findByIdAndUpdate(userId, { lastActive: currentTime }, { new: true });
    if (user) {
        await User.findByIdAndUpdate(userId, { Online: true });
    } else {
        console.error('User not found:', userId);
    }
} catch (error) {
    console.error('Error updating user:', error);
}
   
  
    socket.on("hello",(data)=>{
   
    })
    // Notify the client that the connection is successful
    socket.emit('connected', "connected to server");
   socket.on('accept',(data)=>{
 
   })
    // Handle the 'userOnline' event to track online users
    socket.on('userOnline', async(userId) => {
 
      onlineUsers.set(userId, socket.id);
  
       try{
          let finduser = await User.findOne({_id:userId});
        
          if(finduser){
            finduser.Online=true;
            await finduser.save();
          }
       }catch(err){
        console.log(err);
        return res.status(404).json({message:err.message,isSuccess:false});
       }
    });

    // Handle the 'meet' event
    socket.on('meet', async (data) => {
      const { event, link, reqId, userId,item ,bookingId} = data;
     

      try {
        // Find and update the meeting
        let meeting = await Meeting.findOne({ ReqId: reqId });
        if (!meeting) {
          console.log('Meeting not found');

        }
        meeting.eventId = event;
        meeting.link = link;
        meeting.bookingId=bookingId;
        await meeting.save();
    
        // Check if the user is online and send the meeting link  
        const receiverSocketId = onlineUsers.get(userId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('meetLink', {link ,item});
          let user  = await User.findOne({_id:userId});
    
         
      
        } else {
        
        }
      } catch (err) {
      
      }
      // const user = await User.findOne({_id:userId});
      // console.log(user)
      // const email = user.email; 
      // if(user){
      
      //   
      //   console.log(`Meeting link sent via email to: ${email}`);
      // }
    });

   // handle the instant live
    socket.on('instantLive',(user)=>{
      instantLive.set(user,socket.id);
   
    })

  // now handle the instant request
  
  socket.on('instantRequest',async(data)=>{
   const{sendid,reqid,userName,product}=data;

   const receiverSocketId = instantLive.get(sendid);

   let finddetails = await Experience.findOne({_id:product});

   if(receiverSocketId){
   
    io.to(receiverSocketId).emit('request',{finddetails,userName,reqid});

   }




  //  if (receiverSocketId) {
  //   io.to(receiverSocketId).emit('meetLink', {link });
  //   console.log(`Meeting link sent to user: ${sendid}`);
  // } else {
  //   console.log(`User ${sendid} is offline, unable to send the meeting link.`);
  // }
  // const user = await User.findOne({_id:sendid});
  // if(user){
  //   const email = "sanjubora84@gmail.com";
  //   const subject = "about your meeting link"
  //   const html = `hey user your meeting link is ${link}`; 
  //   sendEmail(email,subject,html);
  //   console.log(`Meeting link sent via email to: ${email}`);
  // }

  })

  socket.on('sendMeet',async(data)=>{
    const{link,evenId,sendid,expid} = data;
    
    const receiverSocketId = instantLive.get(sendid);
  
    let finddetails = await Experience.findOne({_id:expid});

   if(receiverSocketId){
   
    io.to(receiverSocketId).emit('getmeet',{finddetails,link});
   
   }

    
   })

    // Handle chat messages
    socket.on("Onlinchat", async (rid) => {
      chatuser.set(rid, socket.id);
    });


    socket.on("chat", (data) => {
      const { senderid, rid, message } = data;

      const receiverSocketId = chatuser.get(rid);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("recevied", { message });

      } else {
       
      }
    });
 

    socket.on('disconnect', (data) => {
  
 
      // Handle cleanup if needed
    });

    // Handle the 'disconnect' event to remove the user from online users
    socket.on('disconnect', async () => {
      if (socket.userId) {
       
  
        
       let dates = await User.findOneAndUpdate({_id:userId}, { lastActive: currentTime },{new:true});
        await User.findByIdAndUpdate(socket.userId, { Online: false });
       
      }
    });
  });
};

export default socketHandler;

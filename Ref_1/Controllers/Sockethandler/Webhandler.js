import { Meeting } from "../../Models/User/MeetingModel.js";
import { TourInfo } from "../../Models/User/TourInfo.js";
import { User } from "../../Models/User/userModel.js";
import { meetingStartNotificationEmail } from "../../services/CreateEmail.js";
import { sendEmail } from "../../services/EmailServices.js";

const rooms = new Map();
const onlineUsers = new Map();


const Webhandler =(io)=>{
    

let item = {};
let reqdata = {};
let addtime = {};
io.on('connection', (socket) => {
  
    
    socket.on('userOnline', (userId) => {
    
              onlineUsers.set(userId, socket.id);
             
            });
       
            socket.on("details",(data)=>{
              reqdata = data.reqdata;
              item = data.item; //
            
            })
            

    socket.on('create', async(roomId) => {
     

      if (rooms.has(roomId)) {
        socket.emit('error', 'Room already exists');
        return;
      }

   
      rooms.set(roomId, { broadcaster: socket.id, viewers: [] });
      socket.join(roomId);
      socket.emit('created', roomId);

      try{
                let meeting = await Meeting.findOne({ReqId:reqdata.ReqId});
            
                if(!meeting){
                  
                    return;
                }
                meeting.eventId=roomId;
                await meeting.save();
                let users = await User.findOne({_id:reqdata.userId});
                let name = users.userName;
                let email = users.email;
             
      
                sendEmail(email,"Tour live is Started",meetingStartNotificationEmail(users,meeting,roomId));

                let tourinfo = await TourInfo.findOne({bookingId:item.bookingId});
                if(tourinfo){
                  tourinfo.roomId=roomId;
                  tourinfo.Start=1; 
                  await tourinfo.save();
                }
          let meetid = meeting._id;
               const receiverSocketId = onlineUsers.get(reqdata.userId);
                if(receiverSocketId){
                    io.to(receiverSocketId).emit('roomId',{roomId,item,meetid});
                 
                }
                else{
                 
                }
               }catch(err){
          
                
               }
    });
socket.on("offerId",(data)=>{

const{item,generatedRoomId}=data;
const receiverSocketId = onlineUsers.get(item?.userId);
if(receiverSocketId){
    io.to(receiverSocketId).emit('roomIds',{generatedRoomId,item});
  
}
else{
   
}
  
})
  
    // Join room
    socket.on('join', (roomId) => {
     

      if (!rooms.has(roomId)) {
        socket.emit('error', 'Room does not exist');
        return;
      }
      const room = rooms.get(roomId);
      if (!room.broadcaster) {
        socket.emit('error', 'No broadcaster in the room');
        return;
      }
      socket.join(roomId);
      room.viewers.push(socket.id);
      const total = room.viewers.length;

      socket.to(room.broadcaster).emit('viewer', socket.id);
      socket.to(room.broadcaster).emit('total',total);
      socket.emit('joined', roomId);
    
    });

    socket.on('left', (roomId) => {
      if (!rooms.has(roomId)) {
        socket.emit('error', 'Room does not exist');
        return;
      }
      const room = rooms.get(roomId);
      if (!room.broadcaster) {
        socket.emit('error', 'No broadcaster in the room');
        return;
      }
      socket.leave(roomId);
      room.viewers = room.viewers.filter(viewerId => viewerId !== socket.id);
      const total = room.viewers.length;
      socket.emit("total",total);
      socket.to(room.broadcaster).emit('total',total);
  });
  
    // Handle offer
    socket.on('offer', (offer, roomId, viewerId) => {
      socket.to(viewerId).emit('offer', offer, socket.id);
    });
  
    // Handle answer
    socket.on('answer', (answer, roomId, broadcasterId) => {
      socket.to(broadcasterId).emit('answer', answer, socket.id);
    });
  
    // Handle ICE candidate
    socket.on('ice-candidate', (candidate, roomId, recipientId) => {
      socket.to(recipientId).emit('ice-candidate', candidate, socket.id);
    });
  
    // Stop stream
    socket.on('stop', (roomId) => {
      const room = rooms.get(roomId);
      if (room && room.broadcaster === socket.id) {
        io.to(roomId).emit('stop');
        rooms.delete(roomId);
      } else {
        socket.emit('error', 'Only the broadcaster can stop the stream');
      }
    });
  
    // Exit room
    socket.on('exit', (roomId) => {
      if (!rooms.has(roomId)) {
        socket.emit('error', 'Room does not exist');
        return;
      }
      const room = rooms.get(roomId);
      if (room.broadcaster === socket.id) {
        io.to(roomId).emit('broadcaster-left');
        rooms.delete(roomId);
      } else {
        const index = room.viewers.indexOf(socket.id);
        if (index > -1) {
          room.viewers.splice(index, 1);
        }
        socket.leave(roomId);
        socket.to(roomId).emit('viewer-left', socket.id);
      }
    });
    socket.on('send-message', ({ roomId, viewerId, message,user }) => {
        const room = rooms.get(roomId);
        if (room) {
            io.to(roomId).emit('new-message', { viewerId, message,user });
        } else {
            socket.emit('error', { message: 'Room not found' });
        }
    });

  
    // Handle disconnection
    socket.on('disconnect', () => {
      rooms.forEach((room, roomId) => {
        if (room.broadcaster === socket.id) {
          io.to(roomId).emit('broadcaster-left');
          rooms.delete(roomId);
        } else {
          const index = room.viewers.indexOf(socket.id);
          if (index > -1) {
            room.viewers.splice(index, 1);
          }
          if (room.viewers.length === 0 && room.broadcaster === null) {
            rooms.delete(roomId); // Remove room if empty
          } else {
            socket.to(roomId).emit('viewer-left', socket.id);
          }
        }
      });
   
    });
  });

}

export default Webhandler;

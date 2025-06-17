import mongoose from "mongoose";
export const connect =async()=>{
try{
    //await  mongoose.connect(`mongodb+srv://avatar:avatar@cluster0.nce8nas.mongodb.net/AvatarWalks?retryWrites=true&w=majority&appName=Cluster0`)
     await  mongoose.connect("mongodb+srv://avatar:avatar@mycluster.vq0yt.mongodb.net/AvatarWalk");
    console.log("successfully connected");

}
catch(error){
    console.log(error);
    
   
}
}
connect();
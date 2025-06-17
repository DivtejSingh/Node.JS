import { Notification } from "../../Models/User/NotificationModel.js";
import { User } from "../../Models/User/userModel.js";
export const Notifications = async (req, res) => {
    const { _id } = req.user;
    const { Message, Approvedtour, CancelledTour, NewTour, Support } = req.body;
  
    try {
      let findid = await User.findOne({ _id: _id });
     
  
      if (findid) {
        let findnoti = await Notification.findOne({ userId: _id });
  
        if (findnoti) {
          findnoti.Message = Message;
          findnoti.Approvedtour = Approvedtour;
          findnoti.CancelledTour = CancelledTour;
          findnoti.NewTour = NewTour;
          findnoti.Support = Support;
  
          await findnoti.save();
          return res.status(200).json({ message: "Successfully updated", isSuccess: true });
        } else {
          let newnoti = new Notification({
            userId: _id,
            Message: Message,
            Approvedtour: Approvedtour,
            CancelledTour: CancelledTour,
            NewTour: NewTour,
            Support: Support
          });
          await newnoti.save();
          return res.status(200).json({ message: "Successfully updated", isSuccess: true });
        }
      } else {
      
        return res.status(404).json({ message: "User not found" });
      }
  
    } catch (err) {
      return res.status(500).json({ message: err.message, isSuccess: false });
    }
  };
  

export const getNotification = async(req,res)=>{
    const{_id} = req.user;
    try{
        let findnoti = await Notification.findOne({userId:_id});
        if(findnoti){
            return res.status(200).json({message:"Successfully fetched",data:findnoti,isSuccess:true})
        }
        return res.status(200).json({message:"not found",isSuccess:false})

    }catch(err){
        return res.status(404).json({message:err.message,isSuccess:false})
    }
}
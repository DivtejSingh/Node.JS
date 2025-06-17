import { Avathons } from "../../Models/Avatar/Avathons.js";
import { Address } from "../../Models/User/addressModel.js";
import { User } from "../../Models/User/userModel.js";

//get the Avathons

export const getAllAvathons = async (req, res) => {
  try {
    const { items_per_page = 10, pg = 1 } = req.query;
    const itemsPerPage = parseInt(items_per_page, 10);
    const page = parseInt(pg, 10);

    const skip = (page - 1) * itemsPerPage;

    // Get all the pending avathons
    const allRequests = await Avathons.find({
      

      deleteAvathons: 0
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(itemsPerPage);

    // Get the avatarIds from all the requests
    let imageIds = allRequests.map((item) => item?.avatarId);

    // Find the corresponding user profiles by avatarIds
    let userProfile = await User.find({ _id: { $in: imageIds } });

    // Create a map of userId to user image for quick lookup
    const userImageMap = userProfile.reduce((acc, user) => {
      acc[user._id] = user?.profileimage;  // Assuming 'image' is the field storing the image URL
      return acc;
    }, {});

    // Map the corresponding images to the avathons
    const avathonsWithImages = allRequests.map(avathon => {
      return {
        ...avathon.toObject(),
        userImage: userImageMap[avathon.avatarId] || null  // Attach the user image to the avathon
      };
    });

    const totalItems = await Avathons.countDocuments({
      avatarApproved: false,
      status: 0,
      deleteAvathons: 0
    });

    const totalPage = Math.ceil(totalItems / itemsPerPage);

    return res.status(200).json({
      current_page: page,
      data: avathonsWithImages,  // Return the avathons with their corresponding user images
      success: true,
      items_per_page: itemsPerPage,
      message: "Successfully Loaded",
      total_items: totalItems,
      total_page: totalPage
    });
  } catch (err) {
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};



export const getAvathonbyid = async(req,res)=>{
  const {id} = req.params;
  try{
    // check the id is exists or not
    let checkid = await Avathons.findOne({_id:id});
    
    if(checkid){
      let userinfo = await User.findOne({_id:checkid?.avatarId});
      let useradd =await Address.findOne({userId:checkid?.avatarId});

      const getinfo ={
        userInfo:{
          Name:userinfo.userName,
          
          Email:userinfo.email,
          phone:useradd?.mobileNumber || " ",
          city:useradd?.city || " ",
          country:useradd?.country || " ",
          profileImage:useradd?.profileimage || userinfo?.profileimage
        },
        avathonsInfo:checkid
      }
      return res.status(200).json({message:"Successfully fetched",data:getinfo,success:true})
      
    }

  }catch(err){
    return res.status(404).json({message:err.message,isSuccess:false})
  }
}



//accept or reject the Avathons

export const acceptAvathons = async (req, res) => {
    const { id } = req.params; 
    const { status ,reason} = req.body; 

    try {

      const findAvathon = await Avathons.findById(id);

      if (!findAvathon) {
        return res.status(404).json({ message: "Avathon not found", success: false });
      }
  
     
      let updateData = {};
      if (status === 0) {
        updateData = { avatarApproved: true , avathonsStatus:'Accepted'}; 
      } else if (status === 1) {
        if (!reason || reason.trim() === '') {
          return res.status(400).json({ message: "Reason is required for rejection", success: false });
      }
      updateData = { status: 1, avathonsStatus: 'Rejected', RejectReason:reason};
     
      } else {
        return res.status(400).json({ message: "Invalid status value", success: false });
      }
  
      // Update the Avathon
      const updatedAvathon = await Avathons.findByIdAndUpdate(id, updateData, { new: true });
      if (!updatedAvathon) {
        return res.status(500).json({ message: "Failed to update Avathon", success: false });
      }
  
      const actionMessage = status === 0 ? "Successfully Accepted" : "Successfully Rejected";
      return res.status(200).json({ message: actionMessage, success: true, data: updatedAvathon });
      
    } catch (err) {
      return res.status(500).json({ message: err.message, success: false });
    }
  };
  
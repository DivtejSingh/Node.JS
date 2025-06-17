import { Meeting } from "../../Models/User/MeetingModel.js";
import cron from "node-cron";
import moment from "moment-timezone";
import { Available } from "../../Models/Avatar/Availaibilitymodel.js";
import { Request } from "../../Models/User/requestModel.js";
import { Offer } from "../../Models/User/offerMode.js";
import { Account } from "../../Models/User/Account.js";
import { Experience } from "../../Models/Avatar/ExperienceModel.js";
import { User } from "../../Models/User/userModel.js";
import Stripe from "stripe";
import cloudinary from "cloudinary";
import { Address } from "../../Models/User/addressModel.js";
import { Tour } from "../../Models/Avatar/toursModel.js";
import { Booking } from "../../Models/User/bookingModel.js";
import { Dispute } from "../../Models/User/DisputeModel.js";
import { Refund } from "../../Models/User/RefundModel.js";
import { Rating } from "../../Models/Avatar/ratingModel.js";
import { Location } from "../../Models/Avatar/location.js";
import { userProfile } from "../../Models/User/userProfile.js";
import { Payment } from "../../Models/User/Payment.js";
import { Profile } from "../../Models/User/profileModel.js";
import { AvatarRating } from "../../Models/Avatar/avtarRating.js";
import { TourInfo } from "../../Models/User/TourInfo.js";
import { ReportAvt } from "../../Models/User/Avatarreport.js";


export const dashboardDataApi = async (req, res) => {
  try {
    // Fetch avatars from the Account model and populate the 'to' field for userName and id
    const gettopavatars = await Account.find({}, { RefundCommision: 0, PaymentId: 0, TourPrice: 0 })
      .sort({ totalEarning: 1 })
      .populate('to', 'userName'); // Populating only the userName field from the 'to' reference

    // Map through the avatars to include the userName and id
    const alldata = gettopavatars.map(avatar => ({
      ...avatar._doc,
      userName: avatar.to ? avatar.to.userName : null,
      id: avatar.to ? avatar.to._id : null,
    }));

    // Fetch profile images from the Address model using the id
    const userImageData = await Promise.all(
      alldata.map(async (item) => {
        if (item.id) {
          // Find the corresponding Address document by user id
          const address = await Address.findOne({ userId: item.id });
         
        
        // Select only the profileImage field
          return {
            ...item,
            profileImage: address ? address.profileimage : null, // Include profileImage if found
          };
        }
        return { ...item, profileImage: null }; // Return null if no id or no address found
      })
    );

    return res.status(200).json({
      message: "successfully fetched",
      data: userImageData,
      isSuccess: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};

export const newAvatarsapi = async (req, res) => {
  try {
    const findAvt = await userProfile.find({ role: "avatar", userId: { $ne: null } })
      .sort({ createdAt: -1 })
      .populate('userId', 'userName');

    // Check if userId is populated
    const validAvatars = findAvt.filter(avatar => avatar.userId !== null);

    const alldata = validAvatars.map(avatar => ({
      ...avatar._doc,
      userName: avatar.userId ? avatar.userId.userName : null,
      id: avatar.userId ? avatar.userId._id : null,
    }));
  
    const userImageData = await Promise.all(
      alldata.map(async (item) => {
        if (item.id) {
          // Find the corresponding Address document by user id
          const address = await Address.findOne({ userId: item.id });
          const totalearning = await Account.findOne({to:item.id});
        // Select only the profileImage field
          return {
            ...item,
            profileImage: address ? address.profileimage : null, 
            Country:address?address.country:null,// Include profileImage if found
            City:address?address.city:null,
            totalEarning:totalearning?totalearning.totalEarning:null

          };
        }
        return { ...item, profileImage: null }; // Return null if no id or no address found
      })
    );

    // Filter avatars where id matches with the Address database
    userImageData.userId=undefined;

    return res.status(200).json({ message: "successfully", isSuccess: true, data: userImageData });
  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};

export const dashboarddata = async (req, res) => {
  try {
    const currentDate = new Date();
    const oneWeekAgo = new Date(currentDate.setDate(currentDate.getDate() - 7));

    // Active users
    const activeUsers = await User.find({ Online: true });
    const activeUserCount = activeUsers.length;

    // Non-active users
    const nonActiveUsers = await User.find({ Online: false });
    const nonActiveUserCount = nonActiveUsers.length;

    // New users created within the last week
    const newUsers = await User.find({ createdAt: { $gte: oneWeekAgo } });
    const newUserCount = newUsers.length;

    // Total experiences
    const totalExperiences = await Experience.find({status:0});
    const totalExperienceCount = totalExperiences.length;

    // Active / Requested
    const totalRequested = await Request.find({ status: "Requested" });
    const totalRequestedCount = totalRequested.length;

    // Total user spending
    const totalSpendingDocuments = await Account.find({});

    const totalSpending = totalSpendingDocuments.reduce((sum, doc) => {
      // Helper function to sum an array of prices
      const sumArray = (array) => {
        return array.reduce((acc, price) => {
          const numericPrice = parseFloat(price);
          return acc + (isNaN(numericPrice) ? 0 : numericPrice);
        }, 0);
      };
    
      let totalDocSpending = 0;
    
      // Sum TourPrice if it's an array
      if (doc.TourPrice && Array.isArray(doc.TourPrice)) {
        totalDocSpending += sumArray(doc.TourPrice);
      }
    
      // Sum Avathons if it's an array
      if (doc.Avathons && Array.isArray(doc.Avathons)) {
        totalDocSpending += sumArray(doc.Avathons);
      }
    
      // Add addmoreTime if it's a valid number
      if (typeof doc.addmoreTime === 'number' && !isNaN(doc.addmoreTime)) {
        totalDocSpending += doc.addmoreTime;
      }
    
      // Add OfferPrice if it's a valid number
      if (typeof doc.OfferPrice === 'number' && !isNaN(doc.OfferPrice)) {
        totalDocSpending += doc.OfferPrice;
      }
    
      // Add publicJoin if it's a valid number
      if (typeof doc.publicJoin === 'number' && !isNaN(doc.publicJoin)) {
        totalDocSpending += doc.publicJoin;
      }
    
      // Add this document's total spending to the overall total
      return sum + totalDocSpending;
    }, 0);
    

    return res.status(200).json({
      message: "Successfully fetched",
      isSuccess: true,
      data: {
        activeUser: activeUserCount,
        nonActiveUser: nonActiveUserCount,
        newUser: newUserCount,
        totalExp: totalExperienceCount,
        requested: totalRequestedCount,
        totalSpending: totalSpending.toFixed(2)
      }
    });

  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};


export const totalusercommision = async(req,res)=>{
  const adminrole = req.role;
  try{
   if(adminrole==="admin"){
    let findoutuserCommission = await Payment.find({});
    let userCommission = findoutuserCommission
    .filter(commission => commission.adminFee !== undefined) // Filter out undefined values
    .map(commission => commission.adminFee); // Map to get adminFee values

    let totalsum = userCommission.reduce((acc,curr)=>{
      return curr+=acc;
    },0)
  
   let findoutavatarcommission = await Account.find({});
   let avtcommission = findoutavatarcommission
   .filter(commission=>commission.avatarcommision!==undefined)
   .map(commission=>commission.avatarcommision);
   let totalavatar = avtcommission.reduce((acc,curr)=>{
    return curr+=acc;
   },0)
   
    return res.status(200).json({message:"Successfully fetched",data:{
      userCommission:totalsum.toFixed(2),
      avatarCommission:totalavatar.toFixed(2)
    },isSuccess:true})
   }
  }catch(err){
    console.log(err);
    return res.status(404).json({message:err.message,isSuccess:false})
  }
}

export const getTours = async (req, res) => {
  try {
    // Get the user's current timezone


    // Base query for fetching public, succeeded, and booked tours
    const query = {
  
      Status: "Active",
      Start:1

    };

    // Fetch tours based on the query and populate experience details
    const allTours = await TourInfo.find(query,{
 
    }).populate('ExpId', 'lng lat country State city thumbnail ExperienceName avatarName about AmountsperMinute Booking');

    // Get avatarIds from the tours
    const avatarIds = allTours.map(tour => tour.avatarId);
    const userIds = allTours.map(tour=>tour.userId);

    // Fetch timezones and avatar profile images from Address model
    const avatarsData = await Available.find({ avatarId: { $in: avatarIds } });
    const avatarProfiles = await Address.find({ userId: { $in: avatarIds } });
    const letname = await User.find({_id:{$in:userIds}})
  
    const liveTours = allTours.map(tour => {
      // Find the corresponding avatar profile image
      const avatarProfile = avatarProfiles.find(profile => profile.userId.toString() === tour.avatarId.toString());
      const username = letname.find(name=>name._id.toString()===tour.userId.toString())
  
      
      return {
        ...tour._doc,
        lon: tour.ExpId?.lng,
        lat: tour.ExpId?.lat,
        expId: tour.ExpId?._id,
        Country: tour.ExpId?.country,
        State: tour.ExpId?.State,
        City: tour.ExpId?.city,
        RoomId: tour.roomId,
        // Add avatar profile image to the response
        avatarProfileImage: avatarProfile?.profileimage || null,
        username:username.userName
      };
    });

    // Return the filtered tours
    res.status(200).json({ data: liveTours, isSuccess: true, message: "Successfully Fetched" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", isSuccess: false });
  }
};



//accept 

export const updatestatusreport = async (req, res) => {
  const adminrole = req.role;
  const { id } = req.params;

  try {
    // Check if the user has the admin role
    if (adminrole === "admin") {
      // Find and delete the report by avatarID
      const finduser = await ReportAvt.findOneAndDelete({ _id: id });

      if (finduser) {
        // If a report was found and deleted
        return res.status(200).json({ message: "Successfully removed from reported list" });
      } else {
        // If no report was found for the given avatarID
        return res.status(404).json({ message: "Report not found", isSuccess: false });
      }

    } else {
      // If the user does not have permission
      return res.status(403).json({ message: "Permission denied", isSuccess: false });
    }
  } catch (err) {
    console.error("Error removing report:", err);
    // Return server error for unexpected issues
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
}
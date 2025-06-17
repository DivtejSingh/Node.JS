import { User } from "../../Models/User/userModel.js";
import { TourInfo } from "../../Models/User/TourInfo.js";

import moment from 'moment-timezone';
import { Experience } from "../../Models/Avatar/ExperienceModel.js";
import { userProfile } from "../../Models/User/userProfile.js";
import { Available } from "../../Models/Avatar/Availaibilitymodel.js";






export const getTours = async (req, res) => {
  const { _id } = req.user;
  const { publiclive, mostpopular, below$5 } = req.query;

  try {
    // Find the user by _id
    let usercommision = await userProfile.findOne({ userId: _id, role: "user" });
    let adminfee = usercommision ? usercommision.usercommission : 15; // Use user commission if available, otherwise use static commission of 15%

    // Get the user's current timezone
    

    // Build the base query for public, succeeded, and booked tours
    const query = {
      tourType: "Public",
      Status: "Active",
      Start:1

    };

    // Apply additional filters based on query parameters
    if (publiclive === 'true') {
      query.instantlive = true;
    }
    if (mostpopular === 'true') {
      query.Bookings = { $gte: 2 };
    }
    if (below$5 === 'true') {
      query.AmountPerMinute = { $lt: 5 };
    }

    // Fetch all matching tours based on the query
    const allTours = await TourInfo.find(query, {
     
    }).populate('ExpId', 'lng lat country State city thumbnail ExperienceName avatarName about AmountsperMinute Booking');

  

    const liveTours = allTours.map(tour => ({
      ...tour._doc,
      lon: tour.ExpId?.lng,
      lat: tour.ExpId?.lat,
      expId: tour.ExpId?._id,
      Country: tour.ExpId?.country,
      State: tour.ExpId?.State,
      City: tour.ExpId?.city,
      Adminfee: adminfee
    }));


    // Return the filtered tours
    res.status(200).json({ data: liveTours, isSuccess: true, message: "Successfully Fetched" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", isSuccess: false });
  }
};



export const getallmaps = async (req, res) => {
  const { _id } = req.user;
  

  try {
    // Find the user by _id
    let usercommision = await userProfile.findOne({ userId: _id, role: "user" });
    let adminfee = usercommision ? usercommision.usercommission : 15; // Use user commission if available, otherwise use static commission of 15%

    // Get the user's current timezone
    

    // Build the base query for public, succeeded, and booked tours
    

    // Apply additional filters based on query parameters


    // Fetch all matching tours based on the query
    const allTours = await TourInfo.find({}).populate('ExpId', 'lng lat country State city thumbnail ExperienceName avatarName about AmountsperMinute Booking');

  

    const liveTours = allTours.map(tour => ({
      ...tour._doc,
      lon: tour.ExpId?.lng,
      lat: tour.ExpId?.lat,
      expId: tour.ExpId?._id,
      Country: tour.ExpId?.country,
      State: tour.ExpId?.State,
      City: tour.ExpId?.city,
      Adminfee: adminfee
    }));


    // Return the filtered tours
    res.status(200).json({ data: liveTours, isSuccess: true, message: "Successfully Fetched" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", isSuccess: false });
  }
};




  
  //expand the public tour
  
  export const detailpublictour = async(req,res)=>{
    const {_id} =req.user;
    const {expId} = req.body;
    try{
      let isuser = await User.findOne({_id:_id});
      // find the detail of that exp
      if(isuser){
          let findexp = await Experience.findOne({_id:expId},{_id:0,Reviews:0,avatarId:0,images:0,notesForUser:0,status:0,Booking:0,likes:0,rating:0,isFeatured:0,bookinstaltly:0,reportExp:0,lat:0,lng:0});
          if(findexp){
             res.status(200).json({message:"successfully fetched",isSuccess:true,data:findexp})
          }
      }
  
  }catch(err)
  {
    console.log(err.message);
    res.status(404).json({message:err.message,isSuccess:false})
  }
  }

 
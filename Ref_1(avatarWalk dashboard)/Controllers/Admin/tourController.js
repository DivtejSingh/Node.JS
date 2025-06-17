import { Admin } from "../../Models/Admin/AdminModel.js";
import { Experience } from "../../Models/Avatar/ExperienceModel.js";
import { Dispute } from "../../Models/User/DisputeModel.js";
import { Refund } from "../../Models/User/RefundModel.js";
import { Booking } from "../../Models/User/bookingModel.js";
import { User } from "../../Models/User/userModel.js";
import { Payment } from "../../Models/User/Payment.js";
import { Request } from "../../Models/User/requestModel.js";
import { Address } from "../../Models/User/addressModel.js";

//get all tours
export const getalltours = async (req, res) => {
  try {
    const { items_per_page = 10, pg = 1} = req.query;
    const itemsPerPage = parseInt(items_per_page, 10);
    const page = parseInt(pg, 10);
    const skip = (page - 1) * itemsPerPage;
 

    // Find all tours and populate related fields
    let findtours = await Request.find({})
      .skip(skip)
      .limit(itemsPerPage)
      .populate("userId", "userName") // Populate userId with name
      .populate("packageId", "ExperienceName avatarName thumbnail") // Populate packageId with experience name and a name
      .populate("bookingId", "Duration bookingDate bookingTime amountPerminute endTime"); // Populate bookingId with duration

    // Filter tours where userId exists and format the data
    const formattedTours = findtours
      .filter((tour) => tour.userId) // Only include tours where userId is not null
      .map((tour) => ({
        tourId: tour._id,
        userName: tour.userId.userName,
        experienceName: tour.packageId.ExperienceName || " ",
        experienceImage:tour.packageId.thumbnail,
        avatarName: tour.packageId.avatarName,
        bookingDate:tour.bookingId.bookingDate,
        bookingTime:tour.bookingId.bookingTime,
        endTime:tour.bookingId.endTime
        ,
      
        bookingDuration: tour.bookingId.Duration,
        money:tour.bookingId.amountPerminute * tour.bookingId.Duration,
        status: tour.status,
      }));
      let totalItems = await Request.countDocuments();

    const totalPage = Math.ceil(totalItems / itemsPerPage);

    // Send a success response with the filtered and formatted tours data
    return res.status(200).json({
      message: "Tours retrieved successfully",
      isSuccess: true,
      tours: formattedTours,
      current_page: page,
      items_per_page: itemsPerPage,
      total_items: totalItems,
      total_page: totalPage,
    });
  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};

export const tourdetails = async (req, res) => {
  const { id } = req.params;
  const role = req.role;
  try {
     if(role==="admin"){
      let findtourdetails = await Request.findOne({_id:id});
      let userDetails = await User.findOne({_id:findtourdetails.userId});
      let address = await Address.findOne({userId:findtourdetails.userId});
   
      let avatarDetails = await User.findOne({_id:findtourdetails.avatarId})
      let avtaddress = await Address.findOne({userId:findtourdetails.avatarId});
     let bookingtime  = await Booking.findOne({reqId:id});
  
    const formateddata={
      tourInfo:{
        Date:bookingtime?.createdAt,
        TourDuration:bookingtime?.Duration,
        TourStatus:findtourdetails.status,
        TourTime:bookingtime?.bookingTime,
        TourDate:bookingtime?.bookingDate
      },
      avatarInfo:{
        Email:avatarDetails?.email,
        Phone:avtaddress?.mobileNumber,
        City:avtaddress?.city,
        Country:avtaddress?.country,
        ProfileImage:avtaddress?.profileimage || avatarDetails?.profileimage,
        UserName:avatarDetails?.userName,
        FullName:avtaddress?.firstName,
        LastName:avtaddress?.lastName
      },
      userInfo:{
        Email:userDetails?.email,
        Phone:address?.mobileNumber,
        City:address?.city,
        Country:address?.country,
        ProfileImage:address?.profileimage || userDetails?.profileimage,
        UserName:avatarDetails?.userName,
        FullName:address?.firstName,
        LastName:address?.lastName
      }
    }
    return res.status(200).json({message:"Successfully fetched",isSuccess:true,data:formateddata,isSuccess:true});
     }
     else{
      return res.status(404).json({message:"Unauthorized",isSuccess:false})
     }


  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};

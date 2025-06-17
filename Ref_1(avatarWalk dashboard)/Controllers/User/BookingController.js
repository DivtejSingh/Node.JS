import { Booking } from "../../Models/User/bookingModel.js";
import { Experience } from "../../Models/Avatar/ExperienceModel.js";
import { User } from "../../Models/User/userModel.js";

import { startOfDay, endOfDay, addMinutes, formatISO } from "date-fns";
import { Profile } from "../../Models/User/profileModel.js";

import bcrypt from "bcrypt";
import { userProfile } from "../../Models/User/userProfile.js";
import jwt from "jsonwebtoken";
import { Address } from "../../Models/User/addressModel.js";

import { Location } from "../../Models/Avatar/location.js";
import { Offer } from "../../Models/User/offerMode.js";
import { Available } from "../../Models/Avatar/Availaibilitymodel.js";

import { Otp } from "../../Models/User/OtpModel.js";
import nodemailer from "nodemailer";
import { Request } from "../../Models/User/requestModel.js";
import { Report } from "../../Models/User/reportModel.js";
import moment from "moment-timezone";
import { Admin } from "../../Models/Admin/AdminModel.js";
import { TourInfo } from "../../Models/User/TourInfo.js";
import { createHistoryLog } from "../../Utils/Historylog.js";
import { Meeting } from "../../Models/User/MeetingModel.js";
import { BookingAddon } from "../../Models/User/BookingAddon.js";
import { sendEmail } from "../../services/EmailServices.js";
import { adminNewBookingEmail, avatarNewBookingEmail, bookingSuccessEmail, paymentSuccessEmail } from "../../services/CreateEmail.js";
//const booking for packages
export const booking = async (req, res) => {
  const { pid } = req.params;
  const { _id } = req.user;
  const role = req.role;


  const { bookingDate, bookingTime, Duration, tourType } = req.body;

  try {
    // Validate user
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ message: "User not found", isSuccess: false });
    }

    // get email from user to send booking email
    const email=user.email
    const userName=user.userName

    // Validate experience
    const experience = await Experience.findById(pid);
    const avatarid =experience.avatarId;
    
    const findamountperminute = await Experience.findOne({_id:pid});
    const amountperminute = findamountperminute.AmountsperMinute;

    if (!experience || experience.status === 1) {
      return res.status(404).json({ message: "Experience not found or deleted", isSuccess: false });
    }
   let findtimezone = await Available.findOne({avatarId:avatarid});

   let timezone  = findtimezone.timeZone;

    // Check if bookingDate is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of today
    const bookingDateObj = new Date(bookingDate);
    if (bookingDateObj < today) {
      return res.status(400).json({ message: "Booking date and Time cannot be in the past", isSuccess: false });
    }

    // Combine bookingDate and bookingTime into a single Date object
    const startDateTime = new Date(`${bookingDate}T${bookingTime}:00Z`);
    const nowdate = moment();
    let now = nowdate.tz(timezone).format();
  


   

    // Check if the booking time is before the current time
    if (startDateTime < now) {
      return res.status(400).json({ message: "You cannot book in the past", isSuccess: false });
    }

    // Calculate endTime
    const endDateTime = new Date(startDateTime.getTime() + Duration * 60000);

    // Fetch avatar availability
    const availability = await Available.findOne({ avatarId: experience.avatarId });
    if (!availability) {
      return res.status(404).json({ message: "Avatar availability not found", isSuccess: false });
    }

    // Check if booking is within avatar's available hours
    const availableStartTime = new Date(`1970-01-01T${availability.from.toISOString().split('T')[1]}`);
    const availableEndTime = new Date(`1970-01-01T${availability.to.toISOString().split('T')[1]}`);

    const bookingStartTime = new Date(`1970-01-01T${bookingTime}:00Z`);
    const bookingEndTime = new Date(bookingStartTime.getTime() + Duration * 60000);

    if (bookingStartTime < availableStartTime || bookingEndTime > availableEndTime) {
      return res.status(400).json({
        message: `Booking time is outside the avatar's available hours`,
        isSuccess: false,
      });
    }

    // Check for overlapping bookings
    const overlappingBookings = await Booking.find({
      cancel:0,
      payStatus:1,
      avatarId: experience.avatarId,
      bookingDate: bookingDateObj,
      bookingTime: { $lt: endDateTime },
      endTime: { $gt: startDateTime },
    });

    if (overlappingBookings.length > 0) {
      return res.status(409).json({
        message: "Avatar is already booked at that time",
        isSuccess: false,
      });
    }

    // Check for user's overlapping bookings
    const userOverlappingBookings = await Booking.find({
      userId: _id,
      bookingDate: bookingDateObj,
      bookingTime: { $lt: endDateTime },
      endTime: { $gt: startDateTime },
    });


    const existingBooking = await Booking.findOne({
      userId: _id,
      avatarId: experience.avatarId,
      bookingDate: bookingDateObj,
      bookingTime: startDateTime,
      payStatus: 0, // Assuming 'pending' means the booking hasn't been paid yet
    });

    if (existingBooking) {
      // Update the existing booking
      existingBooking.Duration = Duration;
      existingBooking.endTime = endDateTime;
      existingBooking.tourType = tourType;

      const updatedBooking = await existingBooking.save();
      return res.status(200).json({
        message: "Booking updated successfully",
        data: updatedBooking,
        isSuccess: true,
      });
    }





    // Create new booking if user role is 'user'
    if (role === "user") {
      const newBooking = new Booking({
        userId: _id,
        avatarId: experience.avatarId,
        packageIds: pid,
        avatarName: experience.avatarName,
        bookingDate: bookingDateObj,
        bookingTime: startDateTime,
        Duration,
        tourType,
        endTime: endDateTime,
        TimeString:startDateTime,
        amountPerminute:amountperminute
      });
  
      const doc = await newBooking.save();

      
      const newRequest = new Request({
        bookingId: doc._id,
        avatarId: experience.avatarId,
        userId: _id,
        packageId: doc.packageIds,
        status: doc.status,
      
      });

      const reqdoc =await newRequest.save();
      doc.reqId = reqdoc._id;

      await doc.save();

      createHistoryLog({
        userId:_id,
        userName:user.userName,
        avatarId:experience.avatarId,
        experienceId:pid,
        experienceStatus:"Requested",
        avatarName:experience.avatarName,
        experienceName:experience.ExperienceName

      });
    
      const expName=experience.ExperienceName
      
      // Increment booking count in Experience
      experience.Booking = (experience.Booking || 0) + 1;
      await experience.save();
     let findavatar = await User.findOne({_id:experience.avatarId});
     let avataremail = findavatar.email;
     let avatarname = findavatar.userName;

     const bookingDate = new Date(newBooking.bookingDate);

     // Ensure bookingTime is a string
     const originalTimeString = typeof newBooking.bookingTime === 'string'
       ? newBooking.bookingTime
       : newBooking.bookingTime.toISOString(); // Convert Date to ISO string if not already a string
   
     // Remove the 'Z' and convert it to moment object
     const bookingTime = moment(originalTimeString.replace('Z', '')).local();
   
     // Convert the bookingDate to a readable format
     const readableDate = bookingDate.toLocaleDateString('en-US', {
       weekday: 'long', // 'Monday'
       year: 'numeric', // '2024'
       month: 'long', // 'October'
       day: 'numeric' // '21'
     });
   
     // Convert the bookingTime using moment.js for exact time formatting
     const readableTime = bookingTime.format('hh:mm A'); // '6:45 PM'

     
  
      sendEmail(email,"Booking Success", bookingSuccessEmail(expName,userName,newBooking,readableDate,readableTime,avatarname));
      sendEmail(avataremail,"A New Tour Booking",avatarNewBookingEmail(avatarname,newBooking,expName,userName,readableDate,readableTime))
      sendEmail(process.env.EMAIL_USER,"A new tour Booked in your platform",adminNewBookingEmail(avatarname, expName, userName, newBooking, readableDate, readableTime))
      return res.status(201).json({
        message: "Successfully booked the experience",
        data: doc,
        isSuccess: true,
      });
    }

    return res.status(403).json({ message: "Only users can book experiences", isSuccess: false });
  } catch (error) {
    console.error("Error booking experience:", error);
    createHistoryLog({
      experienceId: pid,
      userId:_id,
      errorCode:err,
      errormsg:err.message,
      errorthrow:"During booking the Experience"
    })
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};


export const getBookingDetails = async (req, res) => {
  const { bookingId } = req.params;
  const{_id} = req.user;
  try {
    // Fetch the booking details 

    //fetch the commission
    let usercommision = await userProfile.findOne({userId:_id,role:"user"});
    let adminfee = usercommision.usercommission;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found", isSuccess: false });
    }

    // Fetch the package (experience) details using the packageIds from the booking
    const experience = await Experience.findById(booking.packageIds); // Assuming packageIds stores the experience ID
    if (!experience) {
      return res.status(404).json({ message: "Experience not found", isSuccess: false });
    }

    // Prepare response data with all the package information
    const responseData = {
      booking: {
        _id: booking?._id,
        userId: booking?.userId,
        avatarId: booking?.avatarId,
        packageIds: booking?.packageIds,
        avatarName: booking?.avatarName,
        bookingDate: booking?.bookingDate,
        bookingTime: booking?.bookingTime,
        Adminfee:adminfee,
        tourType: booking?.tourType,
        endTime: booking?.endTime,
        reqId:booking?.reqId
      },

      packageInfo: {
        _id: experience._id,
        avatarId: experience.avatarId,
        avatarImage: experience.avatarImage,
        about: experience.about,
        avatarName: experience.avatarName,
        images: experience.images,
        ExperienceName: experience.ExperienceName,
        thumbnail:experience.thumbnail,
        State: experience.State,
        notesForUser: experience.notesForUser,
        rating:experience.avgRating,
        totalRating:experience.rating,
        city: experience.city,
        country: experience.country,
      },
      priceInfo: {
        Duration: booking.Duration,
        AmountsperMinute: experience.AmountsperMinute,
      },
    };

    return res.status(200).json({
      message: "Booking details retrieved successfully",
      data: responseData,
      isSuccess: true,
    });
  } catch (error) {
    console.error("Error retrieving booking details:", error);
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};


export const updateBookingTime = async (req, res) => {
  const { bookingId } = req.params;
  const { newBookingTime } = req.body;
  const{_id} = req.user;

  try {

    const user = await User.findOne({_id:_id});

    // Validate the new booking time (format HH:MM)
    const timeParts = newBookingTime.split(":");
    if (
      timeParts.length !== 2 ||
      isNaN(timeParts[0]) ||
      isNaN(timeParts[1]) ||
      timeParts[0] < 0 ||
      timeParts[0] > 23 ||
      timeParts[1] < 0 ||
      timeParts[1] > 59
    ) {
      return res.status(400).json({ message: "Invalid booking time format", isSuccess: false });
    }
    
    const now = moment().format();

    // Find the booking by ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found", isSuccess: false });
    }

    const bookingDate = new Date(booking.bookingDate); // Assuming bookingDate is stored as YYYY-MM-DD
    const bookingStartTime = new Date(`1970-01-01T${newBookingTime}:00Z`);
    
    if (bookingStartTime < now) {
      return res.status(400).json({ message: "Cannot select a past time", isSuccess: false });
    }

    // Ensure the duration is a valid number
    const duration = booking.Duration;
    if (typeof duration !== "number" || duration <= 0) {
      return res.status(400).json({ message: "Invalid booking duration", isSuccess: false });
    }

    // Calculate new end time
    const newEndDateTime = new Date(bookingStartTime.getTime() + duration * 60000); // Duration in milliseconds

    // Check for overlapping bookings
    const overlappingBookings = await Booking.find({
      avatarId: booking.avatarId,
      bookingDate: booking.bookingDate,
      bookingTime: { $lt: newEndDateTime },
      endTime: { $gt: bookingStartTime },
    });




    if (overlappingBookings.length > 0) {
      return res.status(409).json({
        message: "Avatar is already booked At that Time",
        isSuccess: false,
      });
    }

    const availability = await Available.findOne({ avatarId: booking.avatarId });

    
    if (!availability) {
      return res.status(404).json({ message: "Avatar availability not found", isSuccess: false });
    }

    // Check if booking is within avatar's available hours
    const availableStartTime = new Date(`1970-01-01T${availability.from.toISOString().split('T')[1]}`);
    const availableEndTime = new Date(`1970-01-01T${availability.to.toISOString().split('T')[1]}`);

    
    const bookingEndTime = new Date(bookingStartTime.getTime() +duration * 60000);

    if (bookingStartTime < availableStartTime || bookingEndTime > availableEndTime) {
      return res.status(400).json({
        message: `Booking time is outside the avatar's available hours`,
        isSuccess: false,
      });
    }
 



    // Update booking times if no overlaps found
    booking.bookingTime = bookingStartTime;
    booking.endTime = bookingEndTime;
    await booking.save();
    createHistoryLog({
      userId:_id,
      userName:user.userName,
      action:"Update the Booking Time",
      id:booking?._id




    })

    return res.status(200).json({
      message: "Booking time successfully updated",
      data: booking,
      isSuccess: true,
    });
  } catch (error) {
    console.error("Error updating booking time:", error);
    return res.status(500).json({ message: "Internal server error", isSuccess: false });
  }
};


export const updateBookingDate = async (req, res) => {
  const { bookingId } = req.params;
  const { newBookingDate } = req.body;

  try {
    // Validate the new booking date
    const date = new Date(newBookingDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: "Invalid booking date format", isSuccess: false });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found", isSuccess: false });
    }

    const newBookingDateTime = new Date(`${newBookingDate}T${booking.bookingTime.toISOString().split("T")[1]}`);

    const duration = booking.Duration;
    if (typeof duration !== "number" || duration <= 0) {
      return res.status(400).json({ message: "Invalid booking duration", isSuccess: false });
    }

    // Calculate new end time
    const newEndDateTime = new Date(newBookingDateTime.getTime() + duration * 60000); // Duration in milliseconds

    // Check for overlapping bookings
    const existingBookings = await Booking.find({
      avatarId: booking.avatarId,
      bookingDate: newBookingDate,
      bookingTime: { $lt: newEndDateTime },
      endTime: { $gt: newBookingDateTime },
      _id: { $ne: bookingId },
    });

    if (existingBookings.length > 0) {
      return res.status(409).json({ message: "The new booking date overlaps with an existing booking", isSuccess: false });
    }

    // Update the booking date
    booking.bookingDate = newBookingDate;
    booking.bookingTime = newBookingDateTime;
    booking.endTime = newEndDateTime;
    await booking.save();

    return res.status(200).json({
      message: "Booking date successfully updated",
      data: booking,
      isSuccess: true,
    });
  } catch (error) {
    console.error("Error updating booking date:", error);
    return res.status(500).json({ message: "Internal server error", isSuccess: false });
  }
};

export const getbookingslots = async (req, res) => {
  const { pid } = req.params; // Package ID
  const { bookingDate } = req.query; // Booking Date from the request


  try {
    // Validate experience
    const experience = await Experience.findOne({ _id: pid });
    if (!experience) {
      return res.status(200).json({ message: "Experience not found", isSuccess: true });
    }

    const { avatarId } = experience;

    // Fetch avatar availability
    const availability = await Available.findOne({ avatarId });
    if (!availability) {
      return res.status(404).json({ message: "Avatar availability not found", isSuccess: false });
    }

    // Convert avatar availability times to Date objects (only time part)
    const availableStartTime = new Date(`1970-01-01T${availability.from.getUTCHours().toString().padStart(2, "0")}:${availability.from.getUTCMinutes().toString().padStart(2, "0")}:00Z`);
    const availableEndTime = new Date(`1970-01-01T${availability.to.getUTCHours().toString().padStart(2, "0")}:${availability.to.getUTCMinutes().toString().padStart(2, "0")}:00Z`);

    // Fetch existing bookings for the given date and avatar
    const existingBookings = await Booking.find({
      avatarId,
      cancel:0,
      payStatus:1,
      bookingDate: new Date(bookingDate),
    }).sort({ bookingTime: 1 }); // Sort by booking start time

    // Calculate remaining available slots between the avatar's availability
    let remainingSlots = [];
    let currentTime = availableStartTime;

    for (const booking of existingBookings) {
      const bookingStartTime = new Date(`1970-01-01T${booking.bookingTime.getUTCHours().toString().padStart(2, "0")}:${booking.bookingTime.getUTCMinutes().toString().padStart(2, "0")}:00Z`);
      if (currentTime < bookingStartTime) {
        remainingSlots.push({
          from: currentTime.toISOString().slice(11, 16), // Convert to HH:MM format
          to: bookingStartTime.toISOString().slice(11, 16),
        });
      }
      currentTime = new Date(bookingStartTime.getTime() + booking.Duration * 60000); // Update currentTime to the end of the booking
    }

    if (currentTime < availableEndTime) {
      remainingSlots.push({
        from: currentTime.toISOString().slice(11, 16),
        to: availableEndTime.toISOString().slice(11, 16),
      });
    }

    return res.status(200).json({
      message: "Remaining available slots retrieved successfully",
      remainingSlots: remainingSlots.length > 0 ? remainingSlots : "No available slots",
      isSuccess: true,
    });
  } catch (error) {
    console.error("Error retrieving booking slots:", error);
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};




export const addextratime = async (req, res) => {
  const { addtime, meetingId, remainingduration,price } = req.body;
  try {
    let findMeetingInfo = await Meeting.findOne({ _id: meetingId });
    if (!findMeetingInfo) {
      return res.status(404).json({ message: 'Meeting not found', isSuccess: false });
    }

    let prevDuration = findMeetingInfo.duration;
    let reqId = findMeetingInfo.ReqId;
    let event_id = findMeetingInfo.eventId;

    // Check if there's an existing addon for the same meetingId
    let existingAddon = await BookingAddon.findOne({ meetingId: meetingId });

    if (existingAddon) {
      // If an addon exists, push the new addtime to the existing addDuration array
      existingAddon.addDuration.push(addtime);
      await existingAddon.save();
    } else {
      // If no addon exists, create a new one
      let newAddon = new BookingAddon({
        meetingId: meetingId,
        prevDuration: prevDuration,
        addDuration: [addtime], // Start with the first added time in an array
        event_id: event_id,
        reqId: reqId,
        price:price
      });
      await newAddon.save();
    }

    // Fetch updated addon to calculate total duration
    let updatedAddon = await BookingAddon.findOne({ meetingId: meetingId });

    // Calculate the total duration (previous duration + sum of added times + remaining duration)
    let totalAddDuration = updatedAddon.addDuration.reduce((acc, time) => acc + time, 0);
  
    let totalDuration =  totalAddDuration + remainingduration;
     updatedAddon.Totalduration=totalDuration;
     await updatedAddon.save();
    return res.status(200).json({ 
      message: 'Time added successfully', 
      Totalduration: totalDuration, 
      isSuccess: true 
    });

  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};


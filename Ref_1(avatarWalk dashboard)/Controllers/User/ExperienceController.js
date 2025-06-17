import { User } from "../../Models/User/userModel.js";
import { Profile } from "../../Models/User/profileModel.js";
import { Rating } from "../../Models/Avatar/ratingModel.js";
import bcrypt from "bcrypt";
import { userProfile } from "../../Models/User/userProfile.js";
import jwt from "jsonwebtoken";
import { Address } from "../../Models/User/addressModel.js";
import { Experience } from "../../Models/Avatar/ExperienceModel.js";
import { Location } from "../../Models/Avatar/location.js";
import { Offer } from "../../Models/User/offerMode.js";
import { Available } from "../../Models/Avatar/Availaibilitymodel.js";
import { Booking } from "../../Models/User/bookingModel.js";
import { Otp } from "../../Models/User/OtpModel.js";
import nodemailer from "nodemailer";
import { Request } from "../../Models/User/requestModel.js";
import { Report } from "../../Models/User/reportModel.js";
import { Payment } from "../../Models/User/Payment.js";
import { Meeting } from "../../Models/User/MeetingModel.js";
import {Avathons} from '../../Models/Avatar/Avathons.js'
import { available } from "../avatar/avatarController.js";
import { Admin } from "../../Models/Admin/AdminModel.js";
import { avathonPayment } from "../../Models/User/AvathonPayment.js";
import { avathonBook } from "../../Models/Avatar/bookingAvathons.js";

export const getExperience = async (req, res) => {
  try {
    const { filters, search, country="United States", items_per_page = 10, pg = 1 } = req.query;


    // Parsing items_per_page and pg from the query parameters
    const itemsPerPage = parseInt(items_per_page, 10);
    const page = parseInt(pg, 10);

    // Calculating the number of documents to skip
    const skip = (page - 1) * itemsPerPage;

    let query = { status: 0 }; // Ensuring that only experiences with status 0 are fetched

    // Applying filters
    switch (filters) {
      
      case "popular":
        query.avgRating = { $gt: 4 };
        query.$expr = { $gt: [{ $size: "$Reviews" }, 2] };
        break;
      case "Featured":
        query.isFeatured = true;
        break;
      case "mostbooked":
        query.Booking = { $gt: 20 };
        break;
      case "recent":
        const oneHourAgo = new Date(new Date().getTime() - 60 * 60 * 1000);
        query.createdAt = { $gte: oneHourAgo };
        break;
      case "recommended":
        query.avgRating = { $gt: 4 };
        break;
    }
    if (filters === "featureevent") {
      // Step 1: Fetch the popular events based on the given filters
      let popularevents = await Avathons.find({
        deleteAvathons: 0,
        status: 0,
        avatarApproved: true
      });
    
      if (popularevents && popularevents.length > 0) {
        // Step 2: Extract avatarIds from the events
        let avatarIds = popularevents.map((item) => item.avatarId);
    
        // Step 3: Fetch the Available data for all avatarIds
        let availableData = await Available.find({ avatarId: { $in: avatarIds } });

        // Step 4: Combine the event data with the corresponding available data (timezone, etc.)
        const eventsWithAvailableData = popularevents.map((event) => {
          // Find the available data for the specific avatarId
          const availableInfo = availableData.find((available) => available.avatarId.toString() === event.avatarId.toString());
       
          return {
            ...event.toObject(), // Convert Mongoose document to plain object
            avatarTimezone: availableInfo ? availableInfo.timeZone : "America/New_York", // Add timezone or default value
            avatarAvailableStatus: availableInfo ? availableInfo.status : "Status not available" ,// You can add more fields from Available
            
          };
        });

        // Step 5: Return the combined data
        return res.status(200).json({
          data: eventsWithAvailableData,
          isSuccess: true,
          message: "Successfully fetched events with their respective available data"
        });
      } else {
        return res.status(200).json({
          message: "No Event Found",
          isSuccess: true
        });
      }
    }
    
    if (country) {
      query.country = country;
    }

    let data;
    let totalItems;
   
    // Fetching experiences based on the filter
    if (search) {
      let searchQuery = {
        status: 0, // Adding status filter to search query
        $or: [
          { city: { $regex: search, $options: "i" } },
          { country: { $regex: search, $options: "i" } },
          { state: { $regex: search, $options: "i" } },
          { ExperienceName: { $regex: search, $options: "i" } },
          { avatarName: { $regex: search, $options: "i" } },
        ],
      };

      totalItems = await Experience.countDocuments(searchQuery);
      data = await Experience.find(searchQuery).skip(skip).limit(itemsPerPage);
    } else {
      totalItems = await Experience.countDocuments(query);
      data = await Experience.find(query).skip(skip).limit(itemsPerPage);
    }

    // Fetching availability and user data for each experience
    const avatarIds = data.map((exp) => exp.avatarId);
    
    // Find all valid users who have avatarIds
    const usersWithAvatars = await User.find({_id: { $in: avatarIds }}); // Fetch only avatarIds
    const validAvatarIds = usersWithAvatars.map(user => user._id.toString());

    // Fetch availability of those valid avatars
    const availabilityData = await Available.find({ avatarId: { $in: validAvatarIds } });

    // Filter out experiences where avatarId is not present in both User model and Available data
    const mergedData = data
      .filter((exp) => {
        const availability = availabilityData.find((avail) => avail.avatarId.equals(exp.avatarId));
        return validAvatarIds.includes(exp.avatarId.toString()) && availability; // Ensure both conditions are met
      })
      .map((exp) => {
        const availability = availabilityData.find((avail) => avail.avatarId.equals(exp.avatarId));
        return {
          ...exp.toObject(),
          availability: availability
            ? {
                from: availability.from,
                to: availability.to,
                timeZone: availability.timeZone,
              }
            : null,
        };
      });

    // Sorting by creation date if the filter is "Recent"
    if (filters === "Recent") {
      mergedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Calculating total pages
    const totalPage = Math.ceil(totalItems / itemsPerPage);

    return res.status(200).json({
      current_page: page,
      data: mergedData,
      isSuccess: true,
      items_per_page: itemsPerPage,
      message: "Successfully fetched all experiences",
      total_items: totalItems,
      total_page: totalPage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};
export const getExperiences = async (req, res) => {
  const {_id} = req.user;
  try {
      let finduser = await User.findOne({_id:_id,status:0,block:0,Freeze:0})
      if(!finduser){
        return res.status(200).json({message:"Not Found",isSuccess:false})
      }

    const { filters, search, country="United States", items_per_page = 10, pg = 1 } = req.query;


    // Parsing items_per_page and pg from the query parameters
    const itemsPerPage = parseInt(items_per_page, 10);
    const page = parseInt(pg, 10);

    // Calculating the number of documents to skip
    const skip = (page - 1) * itemsPerPage;

    let query = { status: 0 }; // Ensuring that only experiences with status 0 are fetched

    // Applying filters
    switch (filters) {
      
      case "popular":
        query.avgRating = { $gt: 4 };
        query.$expr = { $gt: [{ $size: "$Reviews" }, 2] };
        break;
      case "Featured":
        query.isFeatured = true;
        break;
      case "mostbooked":
        query.Booking = { $gt: 20 };
        break;
      case "recent":
        const oneHourAgo = new Date(new Date().getTime() - 60 * 60 * 1000);
        query.createdAt = { $gte: oneHourAgo };
        break;
      case "recommended":
        query.avgRating = { $gt: 4 };
        break;
    }
    if (filters === "featureevent") {
      // Step 1: Fetch the popular events based on the given filters
      let popularevents = await Avathons.find({
        deleteAvathons: 0,
        status: 0,
        avatarApproved: true
      });
    
      if (popularevents && popularevents.length > 0) {
        // Step 2: Extract avatarIds from the events
        let avatarIds = popularevents.map((item) => item.avatarId);
    
        // Step 3: Fetch the Available data for all avatarIds
        let availableData = await Available.find({ avatarId: { $in: avatarIds } });

        // Step 4: Combine the event data with the corresponding available data (timezone, etc.)
        const eventsWithAvailableData = popularevents.map((event) => {
          // Find the available data for the specific avatarId
          const availableInfo = availableData.find((available) => available.avatarId.toString() === event.avatarId.toString());
       
          return {
            ...event.toObject(), // Convert Mongoose document to plain object
            avatarTimezone: availableInfo ? availableInfo.timeZone : "America/New_York", // Add timezone or default value
            avatarAvailableStatus: availableInfo ? availableInfo.status : "Status not available" ,// You can add more fields from Available
            
          };
        });

        // Step 5: Return the combined data
        return res.status(200).json({
          data: eventsWithAvailableData,
          isSuccess: true,
          message: "Successfully fetched events with their respective available data"
        });
      } else {
        return res.status(200).json({
          message: "No Event Found",
          isSuccess: true
        });
      }
    }
    
    if (country) {
      query.country = country;
    }

    let data;
    let totalItems;
   
    // Fetching experiences based on the filter
    if (search) {
      let searchQuery = {
        status: 0, // Adding status filter to search query
        $or: [
          { city: { $regex: search, $options: "i" } },
          { country: { $regex: search, $options: "i" } },
          { state: { $regex: search, $options: "i" } },
          { ExperienceName: { $regex: search, $options: "i" } },
          { avatarName: { $regex: search, $options: "i" } },
        ],
      };

      totalItems = await Experience.countDocuments(searchQuery);
      data = await Experience.find(searchQuery).skip(skip).limit(itemsPerPage);
    } else {
      totalItems = await Experience.countDocuments(query);
      data = await Experience.find(query).skip(skip).limit(itemsPerPage);
    }

    // Fetching availability and user data for each experience
    const avatarIds = data.map((exp) => exp.avatarId);
    
    // Find all valid users who have avatarIds
    const usersWithAvatars = await User.find({_id: { $in: avatarIds }}); // Fetch only avatarIds
    const validAvatarIds = usersWithAvatars.map(user => user._id.toString());

    // Fetch availability of those valid avatars
    const availabilityData = await Available.find({ avatarId: { $in: validAvatarIds } });

    // Filter out experiences where avatarId is not present in both User model and Available data
    const mergedData = data
      .filter((exp) => {
        const availability = availabilityData.find((avail) => avail.avatarId.equals(exp.avatarId));
        return validAvatarIds.includes(exp.avatarId.toString()) && availability; // Ensure both conditions are met
      })
      .map((exp) => {
        const availability = availabilityData.find((avail) => avail.avatarId.equals(exp.avatarId));
        return {
          ...exp.toObject(),
          availability: availability
            ? {
                from: availability.from,
                to: availability.to,
                timeZone: availability.timeZone,
              }
            : null,
        };
      });

    // Sorting by creation date if the filter is "Recent"
    if (filters === "Recent") {
      mergedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Calculating total pages
    const totalPage = Math.ceil(totalItems / itemsPerPage);

    return res.status(200).json({
      current_page: page,
      data: mergedData,
      isSuccess: true,
      items_per_page: itemsPerPage,
      message: "Successfully fetched all experiences",
      total_items: totalItems,
      total_page: totalPage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};



export const getAllExperience = async (req, res) => {
  try {
    // Setting default items per page and current page
    const { items_per_page = 15, pg = 1 ,country="United States" } = req.query;

    // Parsing items_per_page and pg from the query parameters
    const itemsPerPage = parseInt(items_per_page, 10);
    const page = parseInt(pg, 10);

    // Calculating the number of documents to skip
    const skip = (page - 1) * itemsPerPage;

    // Query to fetch experiences with status 0
    let query = { status: 0 };

    // Counting the total number of experiences
    const totalItems = await Experience.countDocuments(query);

    // Fetching experiences based on the query with pagination and sorting by createdAt in descending order
    let data = await Experience.find(query).sort({ createdAt: -1 }).skip(skip).limit(itemsPerPage);

    // Fetching availability for each experience
    const avatarIds = data.map((exp) => exp.avatarId);
    const availabilityData = await Available.find({ avatarId: { $in: avatarIds } });

    // Merging availability with experiences
    const mergedData = data.map((exp) => {
      const availability = availabilityData.find((avail) => avail.avatarId.equals(exp.avatarId));
      return {
        ...exp.toObject(),
        availability: availability
          ? {
              from: availability.from,
              to: availability.to,
              timeZone: availability.timeZone,
            }
          : null,
      };
    });

    // Calculating the total number of pages
    const totalPage = Math.ceil(totalItems / itemsPerPage);

    // Check if this is the last page
    const hasMore = page < totalPage;

    // Returning the paginated data
    return res.status(200).json({
      current_page: page,
      data: mergedData,
      success: true,
      items_per_page: itemsPerPage,
      message: "Successfully fetched all experiences",
      total_items: totalItems,
      total_page: totalPage,
      has_more: hasMore, // Adding has_more to indicate if there are more pages to fetch
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const getdetailExp = async (req, res) => {
  const role = req.role;
  const { _id } = req.user;
  const { id } = req.params;

  try {
    if (role === "user") {
      // Fetch the experience
      const avatarLoc = await Experience.findOne({ _id: id });
      const getAvailable = await Available.findOne({ avatarId: avatarLoc.avatarId });

      // Check if the experience is found
      if (!avatarLoc) {
        return res.status(404).json({ message: "Experience not found", isSuccess: false });
      }

      // Fetch the experiences based on the provided ID
      const experiences = await Experience.find({ _id: id }).lean();

      // Attempt to find the location; handle if not found
      const location = await Location.findOne({ userId: avatarLoc.avatarId }, { _id: 0, __v: 0 });

      // If the location is found, remove userId; otherwise set it to null
      if (location) {
        location.userId = undefined;
      }

      // Fetch reviews for each experience
      for (let experience of experiences) {
        const ratings = await Rating.find({
          ExperienceId: experience._id,
        }).lean();
        experience.Reviews = ratings;
      }

      // Return the response with experiences and location data (if found)
      return res.status(200).json({ data: { experiences, location: location || null, getAvailable }, isSuccess: true });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};
export const getdetailExphome = async (req, res) => {

  const { id } = req.params;

  try {

      // Fetch the experience
      const avatarLoc = await Experience.findOne({ _id: id });
     
      const getAvailable = await Available.findOne({ avatarId: avatarLoc.avatarId });

      // Check if the experience is found
      // if (!avatarLoc) {
      //   return res.status(404).json({ message: "Experience not found", isSuccess: false });
      // }

      // Fetch the experiences based on the provided ID
      const experiences = await Experience.find({ _id: id }).lean();

      // Attempt to find the location; handle if not found
      const location = await Location.findOne({ userId: avatarLoc.avatarId }, { _id: 0, __v: 0 });

      // If the location is found, remove userId; otherwise set it to null
      if (location) {
        location.userId = undefined;
      }

      // Fetch reviews for each experience
      for (let experience of experiences) {
        const ratings = await Rating.find({
          ExperienceId: experience._id,
        }).lean();
        experience.Reviews = ratings;
      }

      // Return the response with experiences and location data (if found)
      return res.status(200).json({ data: { experiences, location: location || null, getAvailable }, isSuccess: true });
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};


export const getFilteredExperience = async (req, res) => {
  try {
    const { Place, Country, State, City, All, items_per_page = 16, pg = 1 } = req.query;
    const itemsPerPage = parseInt(items_per_page, 10);
    const page = parseInt(pg, 10);

    // Calculating the number of documents to skip
    const skip = (page - 1) * itemsPerPage;

    let query = { status: 0 }; 
    if (All) {
      query = { status: 0 }; // No specific filters applied if All is true
    } else {
      if (Place) query.ExperienceName = { $regex: Place, $options: "i" }; // Case-insensitive search by ExperienceName
      if (Country) query.country = { $regex: Country, $options: "i" }; // Case-insensitive search by country
      if (State) query.state = { $regex: State, $options: "i" }; // Case-insensitive search by state
      if (City) query.city = { $regex: City, $options: "i" }; // Case-insensitive search by city
    }

    // Fetch the total count of matching documents
    const totalCount = await Experience.countDocuments(query);

    // Fetch the experiences with pagination
    const data = await Experience.find(query)
      .skip(skip)
      .limit(itemsPerPage);

    // Extract avatarIds from the fetched experiences
    const avatarIds = data.map((exp) => exp.avatarId);

    // Fetch availability records for the corresponding avatarIds
    const availabilities = await Available.find({
      avatarId: { $in: avatarIds },
    });

    // Map availability by avatarId for easy lookup
    const availabilityMap = {};
    availabilities.forEach((availability) => {
      const avatarId = availability.avatarId.toString();
      if (!availabilityMap[avatarId]) {
        availabilityMap[avatarId] = [];
      }
      availabilityMap[avatarId].push(availability);
    });

    // Attach availability data to each experience
    const enrichedData = data.map((exp) => {
      return {
        ...exp.toObject(),
        availabilities: availabilityMap[exp.avatarId.toString()] || [],
      };
    });

    // Return paginated response
    return res.status(200).json({
      message: "Success",
      data: enrichedData,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / itemsPerPage),
      currentPage: page,
      isSuccess: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};


// export const getFilteredExperience = async (req, res) => {
//   try {
//     const { Place, Country, State, City, All,items_per_page = 10, pg = 1 } = req.query;
//     const itemsPerPage = parseInt(items_per_page, 10);
//     const page = parseInt(pg, 10);

//     // Calculating the number of documents to skip
//     const skip = (page - 1) * itemsPerPage;

//     let query = { status: 0 }; 
//     if (All) {
//       query = {status: 0}; // No specific filters applied if All is true
//     } else {
//       if (Place) query.ExperienceName = { $regex: Place, $options: "i" }; // Case-insensitive search by ExperienceName
//       if (Country) query.country = { $regex: Country, $options: "i" }; // Case-insensitive search by country
//       if (State) query.state = { $regex: State, $options: "i" }; // Case-insensitive search by state
//       if (City) query.city = { $regex: City, $options: "i" }; // Case-insensitive search by city
//     }

//     // Fetch the experiences based on the query
//     const data = await Experience.find(query);

//     // Extract avatarIds from the fetched experiences
//     const avatarIds = data.map((exp) => exp.avatarId);

//     // Fetch availability records for the corresponding avatarIds
//     const availabilities = await Available.find({
//       avatarId: { $in: avatarIds },
//     });

//     // Map availability by avatarId for easy lookup
//     const availabilityMap = {};
//     availabilities.forEach((availability) => {
//       const avatarId = availability.avatarId.toString();
//       if (!availabilityMap[avatarId]) {
//         availabilityMap[avatarId] = [];
//       }
//       availabilityMap[avatarId].push(availability);
//     });

//     // Attach availability data to each experience
//     const enrichedData = data.map((exp) => {
//       return {
//         ...exp.toObject(),
//         availabilities: availabilityMap[exp.avatarId.toString()] || [],
//       };
//     });

//     return res.status(200).json({ message: "Success", data: enrichedData, isSuccess: true });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: error.message, isSuccess: false });
//   }
// };

// like increment
export const addlike = async (req, res) => {
  const { id } = req.params;
  const role = req.role;
  try {
    if (role === "user") {
      const experience = await Experience.findOne({ _id: id });
      if (!experience) {
        return res.status(404).json({ message: "Experience not found", isSuccess: false });
      }

      experience.likes = (experience.likes || 0) + 1;
      await experience.save();

      res.status(200).json({ likes: experience.likes, isSuccess: true });
    } else {
      return res.status(401).json({ message: "not authorize" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};

// export const expStatus = async (req, res) => {
//   const { _id } = req.user;
//   const role = req.role;
//   const { status } = req.query;

//   try {
//     if (role !== "user") {
//       return res.status(403).json({ message: "You don't have permission to access this resource", isSuccess: false });
//     }

//     // Validate status parameter
//     const validStatuses = ["Requested", "Booked", "Completed", "Cancelled","Offers"];
//     if (status && !validStatuses.includes(status)) {
//       return res.status(400).json({ message: "Invalid status parameter", isSuccess: true });
//     }





//     if(status==="Offers"){
//       const getallOffers = await Offer.find({userId:_id},{location:0});
//       return res.status(200).json({message:"Successfully fetched",data:getallOffers,isSuccess:true});
//     }

//     // Construct query object
//     let query = { userId: _id };
//     if (status) {
//       query.status = status;
//     } else {
//       query.status = "Requested";
//     }

//     // Find requests and populate packageId and bookingId
//     let requests = await Request.find(query)
//       .populate({
//         path: "packageId", // Populate the packageId field in Request
//         model: "Experience", // Model name for packageId
//       })
//       .populate({
//         path: "bookingId", // Populate the bookingId field in Request
//         model: "Booking", // Model name for bookingId
//       });

//     // Map through requests to format the data
//     const formattedRequests = await Promise.all(
//       requests.map(async (req) => {
//         const experience = req.packageId;
//         const booking = req.bookingId;

//         // Calculate total price based on duration (assuming a fixed price per minute)
//         const pricePerMinute = experience.AmountsperMinute; // Replace with actual pricing logic
//         const totalPrice = booking?.Duration * pricePerMinute || 0;

//         // Find payment related to bookingId
//         const findPayment = await Payment.findOne({ bookingId: booking?._id, status: "Succeeded" });
//         const findtimezone = await Available.findOne({avatarId:experience?.avatarId});

//         // If payment is found, format the result
//         if (findPayment) {
//           return {
//             reqId: req._id,
//             status: req.status,
//             cancelledBy: req.Cancelledby || null, // Assuming you have this field in your schema
//             expId: experience?._id || null,
//             experienceName: experience?.ExperienceName || null,
//             state: experience?.State || null,
//             city: experience?.city || null,
//             country: experience?.country || null,
//             bookingId:booking?._id,
//             bookingDate: booking?.bookingDate || null,
//             bookingTime: booking?.bookingTime || null,
//             bookingStringTime:booking?.TimeString || null,
//             endTime: booking?.endTime || null,
//             totalPrice,
//             avatarName: experience?.avatarName || null,
//             avatarId: experience?.avatarId || null,
//             timezone:findtimezone,
//             experienceImage: experience?.thumbnail || null,
//           };
//         }
//         return null;
//       })
//     );

//     // Filter out any null results (where no payment was found)
//     const filteredRequests = formattedRequests.filter((req) => req !== null);

//     if (filteredRequests.length > 0) {
//       return res.status(200).json({ data: filteredRequests, isSuccess: true });
//     } else {
//       return res.status(200).json({ data: [], message: "No requests found", isSuccess: true });
//     }
//   } catch (err) {
//     return res.status(500).json({ message: err.message, isSuccess: false });
//   }
// };


export const expStatus = async (req, res) => {
  const { _id } = req.user;
  const role = req.role;
  const { status } = req.query;

  try {
    if (role !== "user") {
      return res.status(403).json({ message: "You don't have permission to access this resource", isSuccess: false });
    }

    // Validate status parameter
    const validStatuses = ["Avathons","Requested", "Booked", "Completed", "Cancelled","Offers"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status parameter", isSuccess: true });
    }





    if(status==="Offers"){
      const getallOffers = await Offer.find({userId:_id},{location:0});
      return res.status(200).json({message:"Successfully fetched",data:getallOffers,isSuccess:true});
    }

    if (status === "Avathons") {
      // Fetch booked avathons with Paystatus 0
      const bookedavathons = await avathonBook
          .find({ userId: _id })
          .populate('avathonId');
  
      // Filter and process the avathons with payment conditions
      const avathonsWithAvailability = await Promise.all(
          bookedavathons.map(async (booked) => {
              // Check if a payment record exists for this booking
              console.log(booked._id)
              const findpayment = await avathonPayment.findOne({ bookiId: booked._id ,status: "Succeeded"});
           
  
              // Include only the bookings that satisfy the payment condition
              if (findpayment) {
                  const availability = await Available.findOne({ avatarId: booked.avathonId.avatarId });
                  return {
                      ...booked._doc, // Spread the `booked` document properties
                      availability: {
                          timezone: availability?.timeZone || null, // Extract only the timezone or set to null if not available
                      },
                  };
              }
          })
      );
  
      // Filter out null values in case no records match the payment condition
      const filteredAvathons = avathonsWithAvailability.filter(Boolean);
      return res.status(200).json({
          message: "Successfully fetched",
          data: filteredAvathons,
          isSuccess: true,
      });
  }
  
  
     
    

    // Construct query object
    let query = { userId: _id };
    if (status) {
      query.status = status;
    } else {
      query.status = "Requested";
    }

    // Find requests and populate packageId and bookingId
    let requests = await Request.find(query)
      .populate({
        path: "packageId", // Populate the packageId field in Request
        model: "Experience", // Model name for packageId
      })
      .populate({
        path: "bookingId", // Populate the bookingId field in Request
        model: "Booking", // Model name for bookingId
      });

    // Map through requests to format the data
    const formattedRequests = await Promise.all(
      requests.map(async (req) => {
        const experience = req.packageId;
        const booking = req.bookingId;

        // Calculate total price based on duration (assuming a fixed price per minute)
        const pricePerMinute = experience.AmountsperMinute; // Replace with actual pricing logic
        const totalPrice = booking?.Duration * pricePerMinute || 0;

        // Find payment related to bookingId
        const findPayment = await Payment.findOne({ bookingId: booking?._id, status: "Succeeded" });

        const findtimezone = await Available.findOne({avatarId:experience?.avatarId});

        // If payment is found, format the result
        if (findPayment) {
          return {
            reqId: req._id,
            status: req.status,
            cancelledBy: req.Cancelledby || null, // Assuming you have this field in your schema
            expId: experience?._id || null,
            experienceName: experience?.ExperienceName || null,
            state: experience?.State || null,
            city: experience?.city || null,
            country: experience?.country || null,
            bookingId:booking?._id,
            bookingDate: booking?.bookingDate || null,
            bookingTime: booking?.bookingTime || null,
            bookingStringTime:booking?.TimeString || null,
            endTime: booking?.endTime || null,
            totalPrice,
            avatarName: experience?.avatarName || null,
            avatarId: experience?.avatarId || null,
            timezone:findtimezone,
            experienceImage: experience?.thumbnail || null,
          };
        }
        return null;
      })
    );

    // Filter out any null results (where no payment was found)
    const filteredRequests = formattedRequests.filter((req) => req !== null);

    if (filteredRequests.length > 0) {
      return res.status(200).json({ data: filteredRequests, isSuccess: true });
    } else {
      return res.status(200).json({ data: [], message: "No requests found", isSuccess: true });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};
export const giveRating = async (req, res) => {
  const { rating, comment, AmmountTip } = req.body;
  const { id } = req.params; // Experience ID
  const { _id } = req.user;
  const role = req.role;

  try {
    // Find the experience by ID
    let username = await User.findOne({ _id: _id });
  
    let findexp = await Experience.findOne({ _id: id });
 
    // Find the user's profile image
    let finduserImage = await Address.findOne({ userId: _id });

    if (role === "user") {
      // If profile image is not available, set a default or handle it as null
      const userImage = finduserImage?.profileimage || "";

      // Create a new rating
      let newRating = new Rating({
        userName: username.userName,
        userId: _id,
        avatarId:findexp.avatarId,
        ExperienceId: id,
        rating: rating,
        comment: comment,
        AmmountTip: AmmountTip,
        userImage: userImage,
      });

      // Save the rating and add its ID to the experience's Reviews array
      let doc = await newRating.save();

      findexp.Reviews.push(doc._id);
      findexp.rating.push(doc.rating);

      // Calculate the average rating
      const totalRatings = findexp.rating.length;
      const sumRatings = findexp.rating.reduce((acc, curr) => acc + curr, 0);
      const averageRating = sumRatings / totalRatings;

      // Update the experience with the new average rating
      findexp.avgRating = averageRating;
      await findexp.save();

      return res.status(201).json({ message: doc, isSuccess: true });
    } else {
   
      return res.status(400).json({ message: "only user can give the review", isSuccess: false });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};
export const rating = async(req,res)=>{
  const{_id}=req.user;
  const{id} = req.params;
  try{
    const getrating = await Rating.findOne({userId:_id,ExperienceId:id});
    if(getrating){
      return res.status(200).json({data:true})
    }
    else{
      return res.status(404).json({data:false})
    }
      
  }catch(err){
    console.log(err);
  }
}

export const meetdata = async(req,res)=>{
  const {id} = req.params;
  try{
   
    const findout = await Meeting.findOne({_id:id});
    const avttimezone = await Available.findOne({avatarId:findout.AvatarID})
    return res.status(200).json({data:findout,timeZone:avttimezone.timeZone,isSuccess:true});

  }catch(err){
    
  }
}
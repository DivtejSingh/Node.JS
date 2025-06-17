import { Meeting } from "../../Models/User/MeetingModel.js";
import cron from "node-cron";
import 'dotenv/config';
import moment from "moment-timezone";
import { Available } from "../../Models/Avatar/Availaibilitymodel.js";
import { Request } from "../../Models/User/requestModel.js";
import { Offer } from "../../Models/User/offerMode.js";

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
import { Account } from "../../Models/User/Account.js";
import { promises } from "fs";
import { TourInfo } from "../../Models/User/TourInfo.js";
import { notifi } from "../../Models/User/Offernoti.js";
import { sendEmail } from "../../services/EmailServices.js";
import {
  adminNotificationTourCreated,
  adminNotificationTourBooked,
  bookingCancelEmailAfterCancel,
  bookingSuccessEmail,
  bookingSuccessEmailAfterAccept,
  ExpCreatedSuccessEmail,
} from "../../services/CreateEmail.js";
import { Notification } from "../../Models/User/NotificationModel.js";
import { Avathons } from "../../Models/Avatar/Avathons.js";
import { uploadFileToS3 } from "../../Middleware/uploadfiles3.js";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const stripe = new Stripe(process.env.STRIPE_KEY);

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.v2.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Error removing image ${publicId} from Cloudinary:`, error);
    throw error;
  }
};

const extractPublicIdFromImageUrl = (url) => {
  const regex = /\/([^\/]+)\/([^\/]+)$/; // Extracts public ID from URL
  const match = url.match(regex);
  return match ? match[2].split(".")[0] : null;
};

export const addLocation = async (req, res) => {
  const { _id } = req.user; // Assuming _id is the user's ID from the token
  const role = req.role;

  const { lat, lng } = req.body;

  try {
    if (role === "avatar") {
      if (!lat || !lng) {
        return res.status(404).json({ message: "please Fill the cordinates" });
      }

      let existingLocation = await Location.findOne({ userId: _id });

      if (existingLocation) {
        existingLocation.lat = parseFloat(lat);
        existingLocation.lng = parseFloat(lng);

        await existingLocation.save();

        return res.status(200).json({
          message: "Location updated successfully",
          data: existingLocation,
          isSuccess: true,
        });
      } else {
        const newLocation = new Location({
          userId: _id,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        });

        let data = await newLocation.save();

        return res.status(201).json({
          message: "Location saved successfully",
          data: data,
          isSuccess: true,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};
// get the location
export const getlocation = async (req, res) => {
  const { _id } = req.user;
  try {
    let finduser = await User.findOne({ _id: _id });
    if (finduser) {
      let findLoc = await Location.findOne({ userId: _id });
      return res
        .status(200)
        .json({ message: "location find", isSuccess: true, location: findLoc });
    } else {
      return res.status(404).json({ message: "Not found", isSuccess: false });
    }
  } catch (error) {
    return res.status(404).json({ message: error.message, isSuccess: false });
  }
};

export const Addexperience = async (req, res) => {
  const {
    AmountsperMinute,
    ExperienceName,
    country,
    State,
    city,
    notesForUser,
    about,
    bookinstaltly,
    lat,
    lng,
    from,
    to,
    timeZone,
    timeahead,
  } = req.body;

  const email = req.user.email;
  const userName = req.user.userName;
  const { _id } = req.user;
  const role = req.role;

  try {
    if (role !== "avatar") {
      return res.status(403).json({ message: "Not allowed", isSuccess: false });
    }

    // Validate request body
    if (!from || !to) {
      return res
        .status(400)
        .json({ message: "Missing required fields", isSuccess: false });
    }

    // Convert time strings to moment objects with timezone
    const fromTime = moment.tz(from, "HH:mm", "").toISOString();
    const toTime = moment.tz(to, "HH:mm", "").toISOString();

    // Check if avatarId already exists in the database
    const existingAvailability = await Available.findOne({ avatarId: _id });

    if (existingAvailability) {
      // Update the existing timing
      existingAvailability.from = fromTime;
      existingAvailability.to = toTime;
      existingAvailability.timeZone = timeZone;
      existingAvailability.timeahead = timeahead;

      await existingAvailability.save();
    } else {
      // Create new timing
      const newTiming = new Available({
        avatarId: _id,
        from: fromTime,
        to: toTime,
        timeZone: timeZone,
        timeahead: timeahead,
      });

      // Save the timing
      const doc = await newTiming.save();
    }


    let images = req.files.images;
    let thumbnail = req.files.thumbnail;


    // Initialize imageFiles as an empty array
    let imageFiles = [];
    // find the availability
    let findavl = await Available.findOne({ avatarId: _id });
    if (!findavl) {
      return res
        .status(400)
        .json({ message: "Please First Add Your Availability Time" });
    }

    // If files are provided, map them to paths
    // if (images && images.length > 0) {
    //   imageFiles = images.map((file) => `https://cdn.avatarwalk.com/${file.key}`);
    // }
 
    let thumbnailpath = "";
    // if (thumbnail && thumbnail.length > 0) {
    //   thumbnailpath = thumbnail.map((file) => `https://cdn.avatarwalk.com/${file.key}`);
    // }

  if (req.files.images) {
      for (const file of req.files.images) {
        const fileName = `${Date.now()}_${file.originalname}`;
        const folder = 'images';

        // Push S3 path to array
        imageFiles.push(`https://awcdn.s3-accelerate.amazonaws.com/${folder}/${fileName}`);

        // Background upload
        uploadFileToS3(file.path, fileName, folder).catch((err) =>
          console.error('Image upload failed:', err)
        );
      }
    }


    // Handle video
    if (req.files.thumbnail) {
      const thumbnail = req.files.thumbnail[0];
  
      const fileName = `${Date.now()}_${thumbnail.originalname}`;
      const folder = 'thumbnail';

      // Set S3 path
      thumbnailpath = `https://awcdn.s3-accelerate.amazonaws.com/${folder}/${fileName}`;
   
      // Background upload
      uploadFileToS3(thumbnail.path, fileName, folder).catch((err) =>
        console.error('Video upload failed:', err)
      );
    }


    if (role === "avatar") {
      let findname = await User.findOne({ _id: _id });
      let avImg = await Address.findOne({ userId: _id });

      let newExperience = new Experience({
        avatarId: _id,
        bookinstaltly: bookinstaltly,
        avatarName: findname.userName,
        AmountsperMinute: AmountsperMinute,
        ExperienceName: ExperienceName,
        country: country,
        State: State,
        city: city,
        about: about,
        notesForUser: notesForUser,
        images: imageFiles,
        thumbnail: thumbnailpath || " ",
        avatarImage: avImg ? avImg.profileimage : "",
        lat: lat,
        lng: lng,
      });

      let doc = await newExperience.save();

      // notification check

      sendEmail(
        email,
        "Your Experience created Successfully",
        ExpCreatedSuccessEmail(userName, newExperience)
      );
      sendEmail(
        process.env.EMAIL_USER,
        "A new  Experience  created Successfully",
        adminNotificationTourCreated(userName, email, newExperience)
      );
      return res.status(201).json({
        message: "New Experience Created",
        data: doc,
        isSuccess: true,
      });
    } else {
      return res.status(403).json({
        message: "Role must be 'avatar' to create an Experience or Package",
        isSuccess: false,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while creating the experience",
      error: error.message,
      isSuccess: false,
    });
  }
};

//edit experience for avatar

export const editExperience = async (req, res) => {

  const { _id } = req.user;
  const {
    AmountsperMinute,
    ExperienceName,
    country,
    State,
    city,
    notesForUser,
    about,
    from,
    to,
    timeZone,
    timeahead,
    bookinstaltly,
    removeImages = [],
    removeThumbnail,
    lat,
    lng,
  } = req.body;
  const { id } = req.params;
  const role = req.role;

  try {
    if (role !== "avatar") {
      return res.status(403).json({
        message: "Role must be 'avatar' to edit an Experience",
        isSuccess: false,
      });
    }


    // Fetch the current document
    const existingExperience = await Experience.findOne({_id:id,avatarId:_id});
    console.log(existingExperience);
    if (!existingExperience) {
      return res.status(404).json({
        message: "Experience not found",
        isSuccess: false,
      });
    }
    const fromTime = moment.tz(from, "HH:mm", "").toISOString();
    const toTime = moment.tz(to, "HH:mm", "").toISOString();

    // Check if avatarId already exists in the database
    const existingAvailability = await Available.findOne({ avatarId: _id });

    if (existingAvailability) {
      // Update the existing timing
      existingAvailability.from = fromTime;
      existingAvailability.to = toTime;
      existingAvailability.timeZone = timeZone;
      existingAvailability.timeahead = timeahead;

      await existingAvailability.save();
    }
    let imageFiles = existingExperience.images || [];
    let thumbnailPath = existingExperience.thumbnail || "";

    // Append new images if provided
    if (req.files && req.files.images && req.files.images.length > 0) {
      const newImages = req.files.images.map((file) => file.path);
      imageFiles = [...imageFiles, ...newImages]; // Append new images to the existing ones
    }

    let newThumbnail = "";
    if (req.files && req.files.thumbnail && req.files.thumbnail.length > 0) {
      newThumbnail = req.files.thumbnail[0].path;
      if (thumbnailPath) {
        const thumbnailPublicId = extractPublicIdFromImageUrl(thumbnailPath);
        if (thumbnailPublicId) {
          await deleteFromCloudinary(thumbnailPublicId);
        }
      }
      thumbnailPath = req.files.thumbnail[0].path;
    }

    if (removeImages.length > 0) {
      const rmImages = Array.isArray(removeImages)
        ? removeImages
        : JSON.parse(removeImages);

      for (const imgUrl of rmImages) {
        const publicId = extractPublicIdFromImageUrl(imgUrl);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      }
      imageFiles = imageFiles.filter((img) => !rmImages.includes(img));
    }

    if (removeThumbnail && thumbnailPath) {
      if (thumbnailPath) {
        await deleteFromCloudinary(thumbnailPath);
      }
      thumbnailPath = "";
    }

    const updatedFields = {
      AmountsperMinute: AmountsperMinute ?? existingExperience.AmountsperMinute,
      ExperienceName: ExperienceName ?? existingExperience.ExperienceName,
      country: country ?? existingExperience.country,
      State: State ?? existingExperience.State,
      city: city ?? existingExperience.city,
      notesForUser: notesForUser ?? existingExperience.notesForUser,
      about: about ?? existingExperience.about,
      bookinstaltly: bookinstaltly ?? existingExperience.bookinstaltly,
      images: imageFiles,
      thumbnail: newThumbnail || existingExperience.thumbnail,
      lat: lat || existingExperience.lat,
      lng: lng || existingExperience.lng,
    };

    const updatedExperience = await Experience.findByIdAndUpdate(
      id,
      updatedFields,
      {
        new: true,
      }
    );

    if (!updatedExperience) {
      return res.status(404).json({
        message: "Experience not found",
        isSuccess: false,
      });
    }

    return res.status(200).json({
      message: "Experience updated successfully",
      data: updatedExperience,
      isSuccess: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "An error occurred while updating the experience",
      error: error.message,
      isSuccess: false,
    });
  }
};

export const getExp = async (req, res) => {
  const { _id } = req.user;
  const role = req.role;
  try {
    if (role === "avatar") {
      let findexp = await Experience.find({ avatarId: _id, status: 0 });
      if (findexp) {
        return res.status(200).json({
          message: "succesfully Fetched",
          data: findexp,
          isSuccess: true,
        });
      } else {
        return res
          .status(400)
          .json({ message: "Something error", isSuccess: false });
      }
    } else {
      return res
        .status(404)
        .json({ message: "You don't have access", isSuccess: false });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

// deleteexperience

export const deleteExperience = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    const role = req.role;

    if (role === "avatar") {
      // Check if the experience id is in any booking
      let booking = await Booking.findOne({ packageIds: id });

      // If no booking is found, or booking status is "cancelled" or "completed", allow deletion
      if (
        !booking ||
        booking.status === "cancelled" ||
        booking.status === "completed"
      ) {
        let deletedata = await Experience.findByIdAndUpdate(
          { _id: id },
          { status: status },
          { new: true }
        );

        return res.status(201).json({
          message: "Successfully deleted",
          data: deletedata,
          isSuccess: true,
        });
      } else {
        return res.status(500).json({
          message:
            "Experience is already booked and cannot be deleted until the tour is completed or cancelled.",
          isSuccess: false,
        });
      }
    } else {
      return res.status(403).json({
        message: "Unauthorized role for deleting experience.",
        isSuccess: false,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

// get the offer details
export const offerdetails = async (req, res) => {
  // Extract id from request parameters
  const { id } = req.params;
  const { _id } = req.user;

  try {
    // Find the offer by id and status "Pending"
    let check = await Offer.findOne({ _id: id });

    // Check if an offer was found
    if (check) {
      return res.status(200).json({
        message: "Offer retrieved by ID",
        data: {
          _id: check._id,
          userName: check.userName,
          ExperienceName: check.Title,
          totalPrice: check.Price,
          Duration: check.Minutes,
          Country: check.Country,
          City: check.City,
          State: check.State,
          ZipCode: check.ZipCode,
          Notes: check.Notes,
          lng: check.lng,
          lat: check.lat,
          bookingTime: check.Time,
          endTime: check.endTime,
          bookingDate: check.Date,
          Price: check.Price,
          adminFee: check.adminFee,
          avatarId: check.avatarId,
          payStatus: check.paystatus,
        },
        isSuccess: true,
      });
    } else {
      // Return 404 if no matching offer is found
      return res
        .status(404)
        .json({
          message: "No pending offer found with the given ID",
          isSuccess: false,
        });
    }
  } catch (err) {
    // Handle any errors during execution
    console.log(err);
    return res
      .status(500)
      .json({ message: "Server error: " + err.message, isSuccess: false });
  }
};

//accept or reject
export const acceptOffer = async (req, res) => {
  const { _id } = req.user;
  // the offer id comes from the
  const id = req.params.id;
  const role = req.role;
  const status = req.body;

  try {
    if (role === "avatar") {
      // exact find the corresponding request of the avatar from user
      let updated = await Offer.findOne({ _id: id });
      if (updated) {
        updated.avatarId = _id;
        await updated.save();
      }
      let updatestatus = await Offer.findOneAndUpdate({ _id: id }, req.body, {
        new: true,
      });

      return res.status(201).json({
        message: "Action by avatar Accepted / Rejected",
        data: updatestatus,
        isSuccess: true,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};

//create meeting
export const Instantlive = async (req, res) => {
  //user id
  const { _id } = req.user;

  //avatar id
  const { id } = req.params;
  const { link, startTime, duration, eventId } = req.body;
  try {
    if (link || startTime || duration || eventId) {
      let newMeeting = new Meeting({
        userId: _id,
        AvatarID: id,
        link: link,
        startTime: startTime,
        duration: duration,
        eventId: eventId,
      });
      let meeting = await newMeeting.save();
      return res.status(200).json({
        message: "meeting is successfully created",
        isSuccess: true,
        data: meeting,
      });
    } else {
      return res.status(404).json({ message: "try again ", isSuccess: false });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Something error", isSuccess: false });
  }
};

export const available = async (req, res) => {
  const { _id } = req.user;
  const role = req.role;
  const { from, to, timeZone, timeahead } = req.body;

  try {
    // Check if role is avatar
    if (role !== "avatar") {
      return res.status(403).json({ message: "Not allowed", isSuccess: false });
    }

    // Validate request body
    if (!from || !to) {
      return res
        .status(400)
        .json({ message: "Missing required fields", isSuccess: false });
    }

    // Ensure times are in 24-hour format with minutes (e.g., 'HH:mm')

    // Validate the time zone if necessary

    // Convert time strings to moment objects with timezone
    const fromTime = moment.tz(from, "HH:mm", "").toISOString();
    const toTime = moment.tz(to, "HH:mm", "").toISOString();

    // Check if avatarId already exists in the database
    const existingAvailability = await Available.findOne({ avatarId: _id });

    if (existingAvailability) {
      // Update the existing timing
      existingAvailability.from = fromTime;
      existingAvailability.to = toTime;
      existingAvailability.timeZone = timeZone;
      existingAvailability.timeahead = timeahead;

      await existingAvailability.save();

      return res
        .status(200)
        .json({
          message: "Timing updated",
          data: existingAvailability,
          isSuccess: true,
        });
    } else {
      // Create new timing
      const newTiming = new Available({
        avatarId: _id,
        from: fromTime,
        to: toTime,
        timeZone: timeZone,
        timeahead: timeahead,
      });

      // Save the timing
      const doc = await newTiming.save();

      return res
        .status(201)
        .json({ message: "Timing created", data: doc, isSuccess: true });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};

const kilometersToRadians = (km) => {
  return km / 6378.1; // Earth's radius in kilometers
};
const randomCoordinateWithinRadius = (lat, lng, radiusKm) => {
  const earthRadiusKm = 6371; // Radius of the Earth in km

  // Convert radius from km to degrees
  const radiusDeg = radiusKm / earthRadiusKm;

  // Generate random distance and angle
  const randomDistance = Math.random() * radiusDeg;
  const randomAngle = Math.random() * 2 * Math.PI;

  // Calculate new latitude and longitude
  const deltaLat = randomDistance * Math.cos(randomAngle);
  const deltaLng =
    (randomDistance * Math.sin(randomAngle)) / Math.cos((lat * Math.PI) / 180);

  // Convert latitude and longitude to new coordinates
  const newLat = lat + deltaLat * (180 / Math.PI);
  const newLng = lng + deltaLng * (180 / Math.PI);

  return {
    lat: newLat,
    lng: newLng,
  };
};

// Example usage
const avatarLat = 29.70265095;
const avatarLng = 79.43263182057746;
const radiusKm = 5; // 5 km radius

const randomCoords = randomCoordinateWithinRadius(
  avatarLat,
  avatarLng,
  radiusKm
);

export const getrequests = async (req, res) => {
  const { _id } = req.user; // Assuming address is part of the logged-in user's data
  const role = req.role;
  const { status } = req.query;

  try {
    if (role !== "avatar") {
      return res.status(403).json({
        message: "You don't have permission to access this resource",
        isSuccess: false,
      });
    }

    // Validate status parameter
    const validStatuses = [
      "Offers",
      "Requested",
      "Booked",
      "Completed",
      "Cancelled",
      "Avathons"
    ];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status parameter",
        isSuccess: false,
      });
    }

    let avatarAddress = await Address.findOne({ userId: _id });
    if (!avatarAddress || !avatarAddress.lat || !avatarAddress.lng) {
      console.log("coordinates not found");
    }
    const avatarLocation = [avatarAddress.lng, avatarAddress.lat];

    let findout = await notifi.findOne({ avatarID: _id });

    // If the status is "Offers", fetch the offer details
    if (status === "Offers") {
      const maxDistanceInKm = 5;
      const maxDistanceInRadians = kilometersToRadians(maxDistanceInKm);

      const getallOffers = await Offer.find({
        location: {
          $geoWithin: {
            $centerSphere: [avatarLocation, maxDistanceInRadians], // [longitude, latitude] and distance in radians
          },
        },
      });

      let address = await Address.findOne({ userId: _id });
      // Filter offers by avatar's address
      const filteredOffers = getallOffers.filter(
        (offer) => offer.City.toLowerCase() === address.city.toLowerCase()
      );

      const formattedOffers = filteredOffers.map((offer) => ({
        id: offer._id,
        totalPrice: offer.Price,
        Duration: offer.Minutes,
        ExperienceName: offer.Title,
        UserName: offer.userName,
        Country: offer.Country,
        City: offer.City,
        ZipCode: offer.ZipCode,
        status: offer.status,
        type: offer.Type,
        userId: offer.userId, // Include user ID in the response
        avatarId: offer.avatarId,
        paystatus: offer.paystatus,
        bookingTime: offer.Time,
        endTime: offer.endTime,
        Date: offer.Date,
        // Include avatar ID in the response
      }));


        return res.status(200).json({
          message: "All Offers",
          data: formattedOffers,
          isSuccess: true,
        });
      
    }

   if (status === "Avathons") {
    const getallavathons = await Avathons.find({avatarId:_id,deleteAvathons:0})
  
      // Fetch availability and extract timezone for each avathon
      const avathonsWithAvailability = await Promise.all(
        getallavathons.map(async (booked) => {
              const availability = await Available.findOne({ avatarId: booked.avatarId });
              return {
                  ...booked._doc, // Spread the `booked` document properties
                  availability: {
                      timezone: availability?.timeZone || null, // Extract only the timezone or set to null if not available
                  },
              };
          })
      );
  
      return res.status(200).json({
          message: "Successfully fetched",
          data: avathonsWithAvailability,
          isSuccess: true,
      });
  }





    // Construct query object for other statuses
    let query = { avatarId: _id };
    if (status) {
      query.status = status;
    } else {
      query.status = "Requested";
    }

    // Find requests and populate booking details
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
        const findPayment = await Payment.findOne({
          bookingId: booking?._id,
          status: "Succeeded",
        });

        // If payment is found, format the result
        if (findPayment) {
          return {
            reqId: req._id,
            userId: req?.userId,
            status: req.status,
            cancelledBy: req.Cancelledby || null, // Assuming you have this field in your schema
            expId: experience?._id || null,
            experienceName: experience?.ExperienceName || null,
            state: experience?.State || null,
            city: experience?.city || null,
            country: experience?.country || null,
            bookingDate: booking?.bookingDate || null,
            duration: booking?.Duration || null,
            bookingId: booking?._id || null,
            bookingTime: booking?.bookingTime || null,
            endTime: booking?.endTime || null,
            totalPrice,
            avatarName: experience?.avatarName || null,
            experienceImage: experience?.thumbnail || null,
            paymentId: findPayment._id,
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
      return res
        .status(200)
        .json({ data: [], message: "No data found", isSuccess: true });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

// get  the total experience of avatar
export const avatardetails = async (req, res) => {
  const { _id } = req.user;
  const role = req.role;
  
  const { items_per_page = 10, pg = 1  } = req.query;
 

  // Parsing items_per_page and pg from the query parameters
  const itemsPerPage = parseInt(items_per_page, 10);
  const page = parseInt(pg, 10);

  // Calculating the number of documents to skip
  const skip = (page - 1) * itemsPerPage;
  try {
    let finduser = await User.findOne({_id:_id,status:0,block:0,Freeze:0})
    if(!finduser){
      return res.status(200).json({message:"Not Found",isSuccess:false})
    }
    let findid = await User.findOne({ _id: _id });

    if (findid) {
      if (role === "avatar") {
        // Count the total tours associated with this avatar
        let totaltours = await Experience.countDocuments({
          avatarId: _id,
          status: 0,
        });

        // Count the total canceled tours associated with this avatar
        let cancelledtour = await Request.countDocuments({
          avatarId: _id,
          status: "Cancelled", // Assuming you have a status field to track cancellations
        });

        // Get today's date (YYYY-MM-DD) to find today's tours
        const today = new Date().toISOString().slice(0, 10);

        // Fetch today's tours that are booked today
        let todaytour = await Request.countDocuments({
          avatarId: _id,
          status: "Booked", // Assuming you have a status field to track booked tours
          createdAt: {
            $gte: new Date(today),
            $lt: new Date(
              new Date(today).setDate(new Date(today).getDate() + 1)
            ),
          },
        });

        // Calculate the average rating for this avatar
        let averageRatingData = await Rating.find({ avatarId: _id });

        // Calculate the total and average rating
        const totalRating = averageRatingData.reduce(
          (sum, rating) => sum + rating.rating,
          0
        );
        const averageRating = totalRating / averageRatingData.length;

        // Return the gathered data
        return res.status(200).json({
          data: [
            {
              name: "Total Tours",
              info: totaltours,
            },
            {
              name: "Today Tour",
              info: todaytour,
            },
            {
              name: "Cancelled Tour",
              info: cancelledtour,
            },
            {
              name: "Average Rating",
              info: averageRating.toFixed(2) || 0,
            },
          ],
          isSuccess: true,
        });
      } else {
        return res
          .status(403)
          .json({ message: "Unauthorized role", isSuccess: false });
      }
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//accept or reject

export const handleBookingRequest = async (req, res) => {
  const { requestId } = req.params;
  const { action, reason } = req.body;
  const role = req.role;
  const { _id } = req.user; // Assuming req.user contains the authenticated user's details

  try {
    // Find the booking request
    const bookingRequest = await Request.findById(requestId);

    if (!bookingRequest) {
      return res
        .status(404)
        .json({ message: "Booking request not found", isSuccess: false });
    }

    // Ensure valid action
    if (!["accept", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ message: "Invalid action", isSuccess: false });
    }

    // Handle the action based on the role
    if (action === "accept") {
      // Only avatars can accept the request
      if (role !== "avatar") {
        return res
          .status(403)
          .json({ message: "Unauthorized action", isSuccess: false });
      }

      // Check if the avatar is the one associated with the booking request
      if (bookingRequest.avatarId.toString() !== _id.toString()) {
        return res.status(403).json({
          message: "You are not authorized to accept this request",
          isSuccess: false,
        });
      }

      // Mark the request as accepted
      bookingRequest.status = "Booked";
      await bookingRequest.save();

      // Update booking status to 'Booked'

      const booking = await Booking.findById(bookingRequest.bookingId);
      if (booking) {
        booking.status = "Booked";
        await booking.save();
      }

      const { userId } = booking;
      const { packageIds } = booking;
      const getUser = await User.findById(userId);

      const { userName, email } = getUser;
      // check to get email notification or not
      let findnoti = await Notification.findOne({ userId: userId });
      let expname = await Experience.findOne({ _id: packageIds });
      let experienceName = expname?.ExperienceName;
      if (findnoti) {
        const { Approvedtour } = findnoti;
        if (Approvedtour) {
          sendEmail(
            email,
            "Your Tour Booking Status Changed",
            bookingSuccessEmailAfterAccept(userName, booking)
          );
          sendEmail(
            process.env.EMAIL_USER,
            "New Tour Booked",
            adminNotificationTourBooked(
              experienceName,
              userName,
              email,
              booking
            )
          );
        }
      }

      const updateTourinfo = await TourInfo.findOne({
        bookingId: bookingRequest.bookingId,
      });

      if (updateTourinfo) {
        updateTourinfo.Status = "Active";
        await updateTourinfo.save();
      }

      return res.status(200).json({
        message: "Booking request accepted",
        isSuccess: true,
        data: {
          ...bookingRequest.toObject(),
          status: bookingRequest.status,
        },
      });
    }

    const getpayment = await Payment.findOne({
      bookingId: bookingRequest.bookingId,
    });
    let disputeprice = (80 / 100) * getpayment.price;
    let refundprice = getpayment.price - getpayment.adminFee;
    const getsession = getpayment.SessionId;

    if (action === "reject") {
      const booking = await Booking.findById(bookingRequest.bookingId);
      if (booking) {
        booking.status = "Booked";
        booking.cancel = 1;
        await booking.save();
      }

      if (role === "user") {
        bookingRequest.status = "Cancelled";
        bookingRequest.Cancelledby = "user";
        await bookingRequest.save();

        // Move to the dispute table if user canceled
        const dispute = new Dispute({
          bookingRequestId: bookingRequest._id,
          bookingId: bookingRequest.bookingId,
          paymentId: getpayment?._id,
          paymentIntentId: getpayment?.paymentIntentId,

          reason: reason,
          amount: disputeprice,
          sessionId: getsession,
          Cancelledby: "user",
        });
        await dispute.save();

        const booking = await Booking.findById(bookingRequest.bookingId);
        if (booking) {
          booking.status = "Cancelled";
          booking.cancel = 1;
          await booking.save();
        }

        return res.status(200).json({
          message: "Booking request canceled and moved to dispute",
          isSuccess: true,
          data: {
            ...bookingRequest.toObject(),
            status: bookingRequest.status,
            CancelledBy: "user",
          },
        });
      } else if (role === "avatar") {
        if (bookingRequest.avatarId.toString() !== _id.toString()) {
          return res.status(403).json({
            message: "You are not authorized to cancel this request",
            isSuccess: false,
          });
        }
        const bookings = await Booking.findById(bookingRequest.bookingId);

        //find the experience name
        let exp = await Experience.findOne({_id:packageIds});
        let expname = exp.ExperienceName;

        bookingRequest.status = "Cancelled";
        bookingRequest.Cancelledby = "avatar";

        const getUser = await User.findOne({ _id: bookings.userId });
        const userId = getUser._id;
        let userName = getUser.userName;
        let email = getUser.email;

        let findnoti = await Notification.findOne({ userId: userId });
        if (findnoti) {
          const { CancelledTour } = findnoti;
          if (CancelledTour) {
            sendEmail(
              email,
              "Your Tour Booking Cancelled by Avtar",
              bookingCancelEmailAfterCancel(userName)
            );
         
          }
        }

        await bookingRequest.save();

        const refund = new Refund({
          bookingRequestId: bookingRequest._id,
          bookingId: bookingRequest.bookingId,
          paymentId: getpayment?._id,
          paymentIntentId: getpayment?.paymentIntentId,

          reason: reason,
          amount: refundprice,
          sessionId: getsession,
          Cancelledby: "avatar",
        });
        await refund.save();

        const booking = await Booking.findById(bookingRequest.bookingId);
        if (booking) {
          booking.cancel = 1;
          booking.status = "Cancelled";
          await booking.save();
        }

        return res.status(200).json({
          message: "Booking request canceled and refund initiated",
          isSuccess: true,
          data: {
            ...bookingRequest.toObject(),
            status: bookingRequest.status,
            CancelledBy: "avatar",
          },
        });
      } else {
        return res
          .status(403)
          .json({ message: "Unauthorized action", isSuccess: false });
      }
    }
  } catch (error) {
    console.error("Error handling booking request:", error);
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};

export const allavatars = async (req, res) => {
  try {
    let findall = await userProfile.find({ role: "avatar" }).populate("userId");

    let unapprovedAvatars = findall
      .filter(
        (avatar) => avatar.userId && avatar.userId.isAvatarApproved === false
      )
      .map((avatar) => ({
        _id: avatar._id,
        userName: avatar.userId.userName,
        email: avatar.userId.email,
        isAvatarApproved: avatar.userId.isAvatarApproved,
        profileImage: avatar.userId.profileImage,
      }));

    return res.status(200).json({
      message: "Unapproved avatars retrieved successfully",
      data: unapprovedAvatars,
      isSuccess: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: err.message });
  }
};

export const createMeeting = async (req, res) => {
  const { userId, ReqId, startTime, duration, endTime, bookingId, price } =
    req.body;
  const { _id } = req.user;

  try {
    let existingMeeting = await Meeting.findOne({ ReqId });
    let findtourtype = await Booking.findOne({ _id: bookingId });
    let totalbookings = await Experience.findOne({
      _id: findtourtype?.packageIds,
    });
    let newTour = new TourInfo({
      userId: userId,
      avatarId: _id,
      bookingId: bookingId,
      reqId: ReqId,
      ExpId: findtourtype?.packageIds,
      tourType: findtourtype?.tourType,

      BookingDate: findtourtype?.bookingDate,
      BookingTime: startTime,
      Duration: duration,
      endTime: endTime,

      instantlive: totalbookings?.bookinstaltly,
      Bookings: totalbookings?.Booking,
      AmountPerMinute: findtourtype?.amountPerminute,
      Status: "Active",
    });
    let newtours = await newTour.save();

    if (existingMeeting) {
      existingMeeting.startTime = startTime;
      existingMeeting.endTime = endTime;
      existingMeeting.duration = duration;
      existingMeeting.bookingId = bookingId;
      existingMeeting.status = "Scheduled";
      existingMeeting.ExpId = findtourtype?.packageIds;
      existingMeeting.price = price;

      let updatedMeeting = await existingMeeting.save();

      res
        .status(200)
        .json({
          message: "Meeting updated successfully",
          data: updatedMeeting,
          isSuccess: true,
        });
    } else {
      let newMeeting = new Meeting({
        userId,
        ReqId,
        AvatarID: _id,
        startTime,
        endTime,
        duration,
        bookingId,
        tourtype: findtourtype.tourType,
        ExpId: findtourtype?.packageIds,
        status: "Scheduled",
        price: price,
      });

      let doc = await newMeeting.save();

      return res
        .status(200)
        .json({
          message: "Meeting created successfully",
          data: doc,
          isSuccess: true,
        });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

export const getAvatardetail = async (req, res) => {
  const { id } = req.params;
  const { pg = 1, items_per_page = 10 } = req.query;

  try {
    // Validate page number and items_per_page
    const itemsPerPage = Math.max(1, parseInt(items_per_page, 10));
    const page = Math.max(1, parseInt(pg, 10));
    const skip = (page - 1) * itemsPerPage;

    const findAvt = await User.findById(id);
    if (!findAvt) {
      return res.status(404).json({ message: "User not found", isSuccess: false });
    }

    let findAvailability = await Available.findOne({ avatarId: id });

    // Find the experiences associated with the avatar
    const totalItems = await Experience.countDocuments({ avatarId: id, status: 0 });
    const totalPage = Math.ceil(totalItems / itemsPerPage);

    const findExp = await Experience.find({ avatarId: id, status: 0 }).skip(skip).limit(itemsPerPage);
    const findabout = await Address.findOne({ userId: id });

    // Collect experience IDs to use for finding reviews
    const experienceIds = findExp.map((exp) => exp._id);

    // Find the reviews associated with the experiences of the avatar
    const findReviews = await Rating.find({
      ExperienceId: { $in: experienceIds },
    }).populate("userId", "userName");

    // Assuming avatarImage is stored in Experience
    const avatarImage = findExp.length > 0 ? findExp[0].avatarImage : null;

    // Convert Mongoose document to plain object
    const avatarProfile = findAvt.toObject();
    avatarProfile.avatarImage = avatarImage;

    // Structure the reviews to include the user name
    const reviewsWithUserName = findReviews.map((review) => {
      return {
        ...review.toObject(),
        userName: review.userId ? review.userId.name : "Unknown",
      };
    });

    // Format the avatar creation date to a human-readable format
    const formattedTime = getFormattedTime(avatarProfile.createdAt);

    // Check if this is the last page
    const hasMore = page < totalPage;

    return res.status(200).json({
      message: "Successfully fetched",
      data: {
        userName: avatarProfile.userName,
        year: formattedTime,
        about: findabout?.about,
        Tours: findExp,
        Reviews: reviewsWithUserName,
        avatarImage: findAvt.profileimage,
        Availability: findAvailability,
        Country: findabout?.country,
        code: findabout?.code,
        City: findabout?.city,
        State: findabout?.State,
        has_more: hasMore,
        total_items: totalItems,
        total_page: totalPage,
        items_per_page: itemsPerPage,
        current_page: page,
      },
      isSuccess: true,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

// Helper function to calculate formatted time
const getFormattedTime = (createdAt) => {
  const now = new Date();
  const createdDate = new Date(createdAt);

  // Calculate the difference in time (in milliseconds)
  const diffInMilliseconds = now - createdDate;
  const diffInMonths = diffInMilliseconds / (1000 * 60 * 60 * 24 * 30.4375); // Average days in a month = 30.4375

  // Calculate the total number of years and months
  const years = Math.floor(diffInMonths / 12);
  const months = Math.floor(diffInMonths % 12);

  if (years > 0) {
    return months > 0 ? `${years}.${(months / 12).toFixed(1).substring(2)}y` : `${years} y`;
  } else {
    return `${months} months`;
  }
};


export const AvtRating = async (req, res) => {
  const { rating, comment } = req.body;
  const { id } = req.user;
  const { aid } = req.params; // Use aid from req.params
  const role = req.role;

  try {
    // Check if avatar exists
    let findavt = await User.findOne({ _id: aid });

    if (!findavt) {
      return res
        .status(404)
        .json({ message: "Avatar not found", isSuccess: false });
    }

    // Get user's profile image
    let findUserImage = await Profile.findOne({ userId: id });

    // Only users can give a review to the avatar
    if (role === "user") {
      // Save the new rating
      let avatarRating = new AvatarRating({
        userId: id,
        avatarId: aid,
        Comments: comment,
        rating: rating,
        userImage: findUserImage?.profileimage || "",
      });
      let doc = await avatarRating.save();

      // Calculate the average rating
      let ratings = await AvatarRating.find({ avatarId: aid });
      let totalRating = ratings.reduce((acc, curr) => acc + curr.rating, 0);
      let avgRating = totalRating / ratings.length;

      // Update the avatar's average rating
      findavt.avgRating = avgRating;
      await findavt.save();

      return res
        .status(200)
        .json({
          message: "Rating submitted",
          data: doc,
          isSuccess: true,
          avgRating,
        });
    } else {
      return res
        .status(403)
        .json({ message: "Only users can rate avatars", isSuccess: false });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

export const recentreq = async (req, res) => {
  const { _id } = req.user; // Assuming this is the avatar's ID
  const role = req.role;

  try {
    if (role !== "avatar") {
      return res.status(403).json({
        message: "You don't have permission to access this resource",
        isSuccess: false,
      });
    }

    // Fetch all requests for the specific avatar without filtering by status
    let requests = await Request.find({ avatarId: _id, status: "Requested" })
      .populate({
        path: "packageId", // Populate the packageId field in Request
        model: "Experience", // Model name for packageId
      })
      .populate({
        path: "bookingId", // Populate the bookingId field in Request
        model: "Booking", // Model name for bookingId
      })
      .sort({ "bookingId.bookingDate": -1 }); // Sort by bookingDate in descending order

    // Map through requests to format the data
    const formattedRequests = await Promise.all(
      requests.map(async (req) => {
        const experience = req.packageId;
        const booking = req.bookingId;

        // Calculate total price based on duration (assuming a fixed price per minute)
        const pricePerMinute = experience.AmountsperMinute; // Replace with actual pricing logic
        const totalPrice = booking?.Duration * pricePerMinute || 0;

        // Find payment related to bookingId
        const findPayment = await Payment.findOne({
          bookingId: booking?._id,
          status: "Succeeded",
        });

        // If payment is found, format the result
        if (findPayment) {
          return {
            reqId: req._id,
            userId: req?.userId,
            status: req.status,
            cancelledBy: req.Cancelledby || null, // Assuming you have this field in your schema
            expId: experience?._id || null,
            experienceName: experience?.ExperienceName || null,
            state: experience?.State || null,
            city: experience?.city || null,
            bookingId: booking?._id || null,
            country: experience?.country || null,
            bookingDate: booking?.bookingDate || null,
            bookingTime: booking?.bookingTime || null,
            endTime: booking?.endTime || null,
            duration: booking?.Duration || 0,
            totalPrice,
            avatarName: experience?.avatarName || null,
            experienceImage: experience?.thumbnail || null,
          };
        }
        return null;
      })
    );

    // Filter out any null results (where no payment was found)
    const filteredRequests = formattedRequests.filter((req) => req !== null);

    return res.status(200).json({ data: filteredRequests, isSuccess: true });
  } catch (err) {
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

export const avatarEarning = async (req, res) => {
  const { _id } = req.user; // Get user ID from the request

  try {
    // Find Stripe and PayPal accounts separately
   
    const stripeAccounts = await Account.find({ to: _id, Method: 'stripe' });
    const paypalAccounts = await Account.find({ to: _id, Method: 'paypal' });

    // Find completed avatar tours for the user
    const avatartour = await Request.find({
      avatarId: _id,
      status: "Completed",
    });
    const totalTours = avatartour.length;

    // Function to calculate earnings for a given set of accounts
    const calculateEarnings = (accounts) => {
      let totalEarnings = 0;
      let thisMonthEarnings = 0;
      let todayEarnings = 0;

      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentDate = today.getDate();

      accounts.forEach((account) => {
        const accountTotalEarning = parseFloat(account.totalEarning) || 0;
        totalEarnings += accountTotalEarning;

        const accountDate = new Date(account.Date);
        if (
          accountDate.getFullYear() === currentYear &&
          accountDate.getMonth() === currentMonth
        ) {
          thisMonthEarnings += accountTotalEarning;

          // Calculate today's earnings
          if (accountDate.getDate() === currentDate) {
            todayEarnings += accountTotalEarning;
          }
        }
      });

      return {
        totalEarnings,
        thisMonthEarnings,
        todayEarnings,
      };
    };

    // Calculate earnings for Stripe accounts
    const stripeEarnings = calculateEarnings(stripeAccounts);

    // Calculate earnings for PayPal accounts
    const paypalEarnings = calculateEarnings(paypalAccounts);

    // Combine total earnings, thisMonthEarnings, and todayEarnings
    const totalEarnings = stripeEarnings.totalEarnings + paypalEarnings.totalEarnings;
    const thisMonthEarnings = stripeEarnings.thisMonthEarnings + paypalEarnings.thisMonthEarnings;
    const todayEarnings = stripeEarnings.todayEarnings + paypalEarnings.todayEarnings;

    // Send separate responses for Stripe and PayPal balances
    return res.status(200).json({
      totalEarnings: totalEarnings.toFixed(2),
      thisMonthEarnings: thisMonthEarnings.toFixed(2),
      todayEarnings: todayEarnings.toFixed(2),
      completedTours: totalTours,

      stripe: {
        balance: stripeEarnings.totalEarnings.toFixed(2), // Stripe balance
        accounts: stripeAccounts.map(account => ({
          method: account.Method,
          totalEarning: parseFloat(account.totalEarning).toFixed(2),
        }))
      },
      
      paypal: {
        balance: paypalEarnings.totalEarnings.toFixed(2), // PayPal balance
        accounts: paypalAccounts.map(account => ({
          method: account.Method,
          totalEarning: parseFloat(account.totalEarning).toFixed(2),
        }))
      }
    });
  } catch (err) {
    // Log the error and send an error response
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};


export const getAvailable = async (req, res) => {
  try {
    const { _id } = req.user;
    const { role } = req.role;

    // Check if the role is 'avatar'

    // Find the user
    const user = await User.findOne({ _id });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", isSuccess: false });
    }

    // Find the available time for the avatar
    const availableTime = await Available.findOne({ avatarId: _id });
    if (!availableTime) {
      return res
        .status(200)
        .json({ message: "Availability not found", isSuccess: false });
    }

    // If found, return the available time data
    return res
      .status(200)
      .json({
        message: "Successfully fetched",
        isSuccess: true,
        data: availableTime,
      });
  } catch (err) {
    console.error("Error fetching availability:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", isSuccess: false });
  }
};

// chat with user avatar side
export const chatwithuser = async (req, res) => {
  const { _id } = req.user;

  const role = req.role;
  try {
    if (role === "avatar") {
      // Fetch bookings where the avatar is involved
      const bookings = await Booking.find({
        avatarId: _id,
        status: { $in: ["Booked", "Completed"] },
      }).populate("userId", "userName");

      // Use a Set to collect unique user IDs
      const userIdSet = new Set();
      bookings.forEach((booking) => userIdSet.add(booking.userId));

      // Fetch unique users from the set of user IDs
      const uniqueUsers = await User.find({
        _id: { $in: Array.from(userIdSet) },
      });

      // Fetch profile images
      const profiles = await Address.find({
        userId: { $in: Array.from(userIdSet) },
      });

      // Create a mapping of userId to profile image URL
      const profileMap = profiles.reduce((acc, profile) => {
        acc[profile.userId.toString()] = profile.profileimage;
        return acc;
      }, {});

      // Map user details including profile image URL
      const data = uniqueUsers.map((user) => ({
        id: user._id,
        name: user.userName,
        profile: profileMap[user._id.toString()] || null, // Get the profile image URL
      }));

      // return
      if (data.length === 0) {
        return res.status(200).json({ message: "No data found" });
      }

      return res.status(200).json({ data, isSuccess: true });
    } else {
      return res
        .status(400)
        .json({ message: "Invalid role", isSuccess: false });
    }
  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};

// get the offers or not
export const offernoti = async (req, res) => {
  const { _id } = req.user;
  const { offer } = req.body; // Assuming offer is part of req.body

  try {
    let findId = await notifi.findOne({ avatarID: _id });

    if (findId) {
      // Update the existing offer
      findId.offer = offer;
      await findId.save();
      return res
        .status(200)
        .json({ message: "Offer updated successfully", isSuccess: true });
    } else {
      // Create a new offer
      let newOffer = new notifi({
        avatarID: _id,
        offer: offer,
      });
      await newOffer.save();
      return res
        .status(201)
        .json({ message: "Offer saved successfully", isSuccess: true });
    }
  } catch (err) {
    console.error("Error saving offer notification:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", isSuccess: false });
  }
};

export const getOffernoti = async (req, res) => {
  const { _id } = req.user;
  try {
    let findid = await notifi.findOne({ avatarID: _id });
    if (findid) {
      return res
        .status(200)
        .json({
          message: "successfully fetched",
          isSuccess: true,
          data: findid,
        });
    }
  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};

// create avathons
export const createAvathons = async (req, res) => {
  const { Title, Description, price, avathonDate, Time, Hours, Discount, Viewers } = req.body;
  const { _id } = req.user;

  try {
    // Validate and parse the date and time
    const timeOnly = Time.split(":"); // Expecting time in format "HH:MM"
    if (timeOnly.length !== 2 || isNaN(timeOnly[0]) || isNaN(timeOnly[1])) {
      return res.status(400).json({ message: "Invalid time format. Expected HH:MM.", isSuccess: false });
    }

    const dateOnly = new Date(avathonDate);
    if (isNaN(dateOnly.getTime())) {
      return res.status(400).json({ message: "Invalid date format", isSuccess: false });
    }

    const startHours = parseInt(timeOnly[0], 10);
    const startMinutes = parseInt(timeOnly[1], 10);
    if (startHours < 0 || startHours > 23 || startMinutes < 0 || startMinutes > 59) {
      return res.status(400).json({ message: "Time values out of range. Expected HH:MM in 24-hour format.", isSuccess: false });
    }

    // Combine the date and time into a full ISO timestamp
    const startDateTime = new Date(dateOnly);
    startDateTime.setUTCHours(startHours, startMinutes, 0, 0);

    // Calculate the end time of the event
    const durationInMs = Hours * 60 * 60 * 1000; // Convert hours to milliseconds
    const endDateTime = new Date(startDateTime.getTime() + durationInMs);

    // Check for conflicting events
    const existingEvents = await Avathons.find({
      avatarId: _id,
      avathonDate: avathonDate, // Check only events on the same date
    });

    for (const event of existingEvents) {
      const eventStart = new Date(event.avathonTime);
      const eventEnd = new Date(eventStart.getTime() + event.avathonHours * 60 * 60 * 1000);

      if (
        (startDateTime >= eventStart && startDateTime < eventEnd) || // New event starts during an existing event
        (endDateTime > eventStart && endDateTime <= eventEnd) || // New event ends during an existing event
        (startDateTime <= eventStart && endDateTime >= eventEnd) // New event overlaps completely
      ) {
        return res.status(400).json({
          message: `Event time conflicts with an existing event from `,
          isSuccess: false,
        });
      }
    }

    // Get the avatar's name
    const nameavt = await User.findOne({ _id: _id });
    if (!nameavt) {
      return res.status(404).json({ message: "Avatar not found", isSuccess: false });
    }
    const avtname = nameavt.userName;
    const avtemail = nameavt.email;

    // Create the new event
    const newAvathns = new Avathons({
      avatarId: _id,
      avatarName: avtname,
      avathonTitle: Title,
      avathonPrice: price,
      avathonDate: avathonDate,
      avathonTime: startDateTime,
      avathonHours: Hours,
      Discount: Discount,
      avathonDescription: Description,
      Members: Viewers,
      endEvent:endDateTime,
      avataremail:avtemail
    
    });

    await newAvathns.save();
    return res.json({ data: newAvathns, isSuccess: true, message: "Successfully created event" });

  } catch (err) {
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};


export const deleteAvathons = async(req,res)=>{
  const{id} = req.params;
  try{
    let check = await Avathons.findOne({_id:id});
    if(check){
      let deleteAvathon = await Avathons.findByIdAndUpdate({_id:id},{deleteAvathons:1},{new:true})

      return res.status(200).json({message:"Successfully Deleted",isSuccess:true})
    }
    else{

      return res.status(404).json({message:"Id not found",isSuccess:false})
    }

  }catch(err){
    return res.status(404).json({message:err.message,isSuccess:false})
  }
}

//
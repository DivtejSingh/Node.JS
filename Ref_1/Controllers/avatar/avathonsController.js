import { Avathons } from "../../Models/Avatar/Avathons.js";
import { Address } from "../../Models/User/addressModel.js";
import { User } from "../../Models/User/userModel.js";
import cloudinary from "cloudinary";
import { sendEmail } from "../../services/EmailServices.js";
import { avathonCreationNotification } from "../../services/CreateEmail.js";
import { uploadFileToS3 } from "../../Middleware/uploadfiles3.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// function from delete the image or replace it from cloudinary
const deleteFromCloudinary = async (publicId) => {
  console.log(publicId);
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







export const Addavathons = async (req, res) => {
  const {
    RegularPrice,
    AvathonName,
    EarlybirdPrice,
    Availablespots,
    Eighteenplus,
    aboutStream,
    avathonDescription,
    country,
    State,
    city,
    Time,
    Hours="1",
    avathonDate,
    
    lat,
    lng,
  } = req.body;



  const { _id } = req.user;
  const role = req.role;




  try {
    if (role !== "avatar") {
      return res.status(403).json({ message: "Not allowed", isSuccess: false });
    }

    let images = req.files.images;
    let video = req.files.video;
    
    let imageFiles = [];
    let videoPath = ""; // Initialize video path variable
    // if (video && video.length > 0) {
    //   if (video && video.length > 0) {
    //     videoPath = video.map((file) => `https://awcdn.s3-accelerate.amazonaws.com/${file.key}`);
    //   }
    // }

  
    // // If files are provided, map them to paths
    // if (images && images.length > 0) {
    //   imageFiles = images.map((file) => `https://awcdn.s3-accelerate.amazonaws.com/${file.key}`);
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
    if (req.files.video && req.files.video.length > 0) {
      const video = req.files.video[0];
      const fileName = `${Date.now()}_${video.originalname}`;
      const folder = 'videos';

      // Set S3 path
      videoPath = `https://awcdn.s3-accelerate.amazonaws.com/${folder}/${fileName}`;
   
      // Background upload
      uploadFileToS3(video.path, fileName, folder).catch((err) =>
        console.error('Video upload failed:', err)
      );
    }




 
    const timeOnly = Time.split(":"); // Expecting time in format "HH:MM"
    if (timeOnly.length !== 2 || isNaN(timeOnly[0]) || isNaN(timeOnly[1])) {
      return res
        .status(400)
        .json({
          message: "Invalid time format. Expected HH:MM.",
          isSuccess: false,
        });
    }

    const dateOnly = new Date(avathonDate);
    if (isNaN(dateOnly.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid date format", isSuccess: false });
    }

    const startHours = parseInt(timeOnly[0], 10);
    const startMinutes = parseInt(timeOnly[1], 10);
    if (
      startHours < 0 ||
      startHours > 23 ||
      startMinutes < 0 ||
      startMinutes > 59
    ) {
      return res
        .status(400)
        .json({
          message:
            "Time values out of range. Expected HH:MM in 24-hour format.",
          isSuccess: false,
        });
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
      const eventEnd = new Date(
        eventStart.getTime() + event.avathonHours * 60 * 60 * 1000
      );

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

    if (role === "avatar") {
      let findname = await User.findOne({ _id: _id });
      let avtname = findname.userName;
      let avImg = await Address.findOne({ userId: _id });

      let newavathons = new Avathons({
        avatarId: _id,
        avatarName: avtname,
        Eighteenplus: Eighteenplus,
        avataremail: findname?.email,
        avathonPrice: RegularPrice,
        avathonTitle: AvathonName,
        Country: country,
        State: State,
        City: city,
        avathonDescription: avathonDescription,

        EarlybirdPrice: EarlybirdPrice,
        avathonsThumbnail: videoPath|| " ",
        Availablespots: Availablespots,
        avathonsImage: imageFiles,
        aboutStream: aboutStream,
        avatarImage: avImg ? avImg.profileimage : "",
        lat: lat,
        lng: lng,
        avathonDate: avathonDate,
        avathonTime: startDateTime,
        avathonHours: Hours,
        endEvent: endDateTime,
      });

      let doc = await newavathons.save();
    sendEmail(doc.avataremail,"Successfully Created a New Avathons", avathonCreationNotification(doc))
      return res.status(201).json({
        message: "New Avathon Created",
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





export const  myavathons = async(req,res)=>{
  const{_id} = req.user;
  const role = req.role;
  try{
    //fetch the all avathons of that particular avatar
    if(role==="avatar"){
      let fetchavathons = await Avathons.find({avatarId:_id,deleteAvathons:0});
      if(fetchavathons){
        return res.status(200).json({message:"Successfully fetched",isSuccess:true,data:fetchavathons})
      }else{
        return res.status(200).json({message:"No Avathons created",isSuccess:false,data:{}})
      }

    }
    else{
      return res.status(404).json({message:"Not allowed", isSuccess:false});
    }

     

  }catch(error){
    return res.status(404).json({message:error})
  }
}
//edit experience for avatar

export const editAvathons = async (req, res) => {
  const { _id } = req.user;
  const {
    RegularPrice,
    AvathonName,
    EarlybirdPrice,
    Availablespots,
    Eighteenplus,
    aboutStream,
    avathonDescription,
    country,
    State,
    city,
    Time,
    Hours = "1",
    avathonDate,
    lat,
    lng,
    removeImages = [],
    removeThumbnail,
  } = req.body;
  const { id } = req.params;
  const role = req.role

 

  try {
    if (role !== "avatar") {
      return res.status(403).json({
        message: "Role must be 'avatar' to edit an Experience",
        isSuccess: false,
      });
    }

    // Fetch the current document
    const existingExperience = await Avathons.findById(id);
    if (!existingExperience) {
      return res.status(404).json({
        message: "Experience not found",
        isSuccess: false,
      });
    }

    let imageFiles = existingExperience.avathonsImage || [];
    let thumbnailPath = existingExperience.avathonsThumbnail || "";

    // Append new images if provided
    if (req.files && req.files.images && req.files.images.length > 0) {
      const newImages = req.files.images.map((file) => file.path);
      imageFiles = [...imageFiles, ...newImages]; // Append new images to the existing ones
    }

    let newThumbnail = "";
    if (req.files && req.files.video && req.files.video.length > 0) {
      newThumbnail = req.files.video[0].path;
      if (thumbnailPath) {
        const thumbnailPublicId = extractPublicIdFromImageUrl(thumbnailPath);
        if (thumbnailPublicId) {
          await deleteFromCloudinary(thumbnailPublicId);
        }
      }
      thumbnailPath = req.files.video[0].path;
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

    // Handling the avathonDate (should be in format YYYY-MM-DD)
    const dateOnly = new Date(avathonDate);
    if (isNaN(dateOnly.getTime())) {
      // Check if date format is valid (YYYY-MM-DD)
      const dateParts = avathonDate.split("-");
      if (dateParts.length !== 3 || dateParts[0].length !== 4 || dateParts[1].length !== 2 || dateParts[2].length !== 2) {
        return res.status(400).json({ message: "Invalid date format", isSuccess: false });
      }
      // Manually parse the date as YYYY-MM-DD
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
      const day = parseInt(dateParts[2], 10);
      const validDate = new Date(year, month, day);
      
      if (isNaN(validDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format", isSuccess: false });
      }
      dateOnly.setFullYear(year, month, day);
    }

    // Ensure Time exists and is a string before using split
    if (!Time || typeof Time !== 'string' || Time.split(":").length !== 2) {
      return res.status(400).json({
        message: "Invalid time format. Expected HH:MM.",
        isSuccess: false,
      });
    }

    const timeOnly = Time.split(":");
    if (isNaN(timeOnly[0]) || isNaN(timeOnly[1])) {
      return res.status(400).json({
        message: "Invalid time format. Expected HH:MM.",
        isSuccess: false,
      });
    }

    const startHours = parseInt(timeOnly[0], 10);
    const startMinutes = parseInt(timeOnly[1], 10);

    if (startHours < 0 || startHours > 23 || startMinutes < 0 || startMinutes > 59) {
      return res.status(400).json({
        message: "Time values out of range. Expected HH:MM in 24-hour format.",
        isSuccess: false,
      });
    }

    // Combine the date and time into a full ISO timestamp
    const startDateTime = new Date(dateOnly);
    startDateTime.setUTCHours(startHours, startMinutes, 0, 0);

    // Calculate the end time of the event
    const durationInMs = Hours * 60 * 60 * 1000; // Convert hours to milliseconds
    const endDateTime = new Date(startDateTime.getTime() + durationInMs);

    const updatedFields = {
      avathonPrice: RegularPrice ?? existingExperience.RegularPrice,
      avathonTitle: AvathonName ?? existingExperience.avathonTitle,
      Country: country ?? existingExperience.Country,
      State: State ?? existingExperience.State,
      City: city ?? existingExperience.City,
      avathonDescription: avathonDescription ?? existingExperience.avathonDescription,
      aboutStream: aboutStream ?? existingExperience.aboutStream,
      Eighteenplus: Eighteenplus ?? existingExperience.Eighteenplus,
      avathonsImage: imageFiles,
      avathonsThumbnail: newThumbnail || existingExperience.avathonsThumbnail,
      avathonDate: avathonDate || existingExperience.avathonDate,
      avathonTime: startDateTime || existingExperience.avathonTime,
      avathonHours: Hours || existingExperience.avathonHours,
      lat: lat || existingExperience.lat,
      lng: lng || existingExperience.lng,
      endEvent: endDateTime || existingExperience.endEvent,
      EarlybirdPrice: EarlybirdPrice || existingExperience.EarlybirdPrice,
      Availablespots: Availablespots || existingExperience.Availablespots,
    };

    const updatedExperience = await Avathons.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    if (!updatedExperience) {
      return res.status(404).json({
        message: "Avathon not found",
        isSuccess: false,
      });
    }

    return res.status(200).json({
      message: "Avathon updated successfully",
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
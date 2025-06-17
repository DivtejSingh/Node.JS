import { User } from "../../Models/User/userModel.js";
import { userProfile } from "../../Models/User/userProfile.js";
import { Address } from "../../Models/User/addressModel.js";
import { Request } from "../../Models/User/requestModel.js";
import { MobileDevices } from "../../Models/User/Mobilemodel.js";
export const getAllAvatar = async (req, res) => {
  try {
    // Get query parameters for pagination and search filters
    const { items_per_page = 10, pg = 1, city, country, state, email } = req.query;
    
    // Convert items_per_page and pg to numbers
    const itemsPerPage = parseInt(items_per_page, 10);
    const page = parseInt(pg, 10);

    // Calculate the number of documents to skip
    const skip = (page - 1) * itemsPerPage;

    // Build search filters for address and user based on the provided query parameters
    const searchFilters = {};
    
    if (email) {
      searchFilters.email = { $regex: email, $options: "i" }; // Case-insensitive email search
    }

    const addressFilters = {};
    if (city) {
      addressFilters.city = { $regex: city, $options: "i" }; // Case-insensitive city search
    }
    if (country) {
      addressFilters.country = { $regex: country, $options: "i" }; // Case-insensitive country search
    }
    if (state) {
      addressFilters.State = { $regex: state, $options: "i" }; // Case-insensitive state search
    }

    // Find all user profiles with role 'avatar'
    const userProfiles = await userProfile.find({ role: "avatar" }) || [];

    // Extract userIds from userProfile
    const userIds = userProfiles.map(profile => profile.userId);

    // Find only those users who are present in the User model and match the email filter if provided
    const totalusers = await User.find({ _id: { $in: userIds }, ...searchFilters }) || [];
    const totaluserS = totalusers.length;

    // Paginate the users based on the provided page number and items per page
    const users = await User.find({ _id: { $in: userIds }, ...searchFilters })
      .skip(skip)
      .limit(itemsPerPage) || [];

    // Find addresses and devices for the filtered users, applying the address search filters
    const address = await Address.find({ userId: { $in: userIds }, ...addressFilters }) || [];
    const devices = await MobileDevices.find({ avatarId: { $in: userIds } }) || [];

    // Filter the user profiles to only include those where userId matches a valid User
    const validProfiles = userProfiles.filter(profile => 
      users.some(user => String(user._id) === String(profile.userId))
    );

    // Format the final result for the response
    const formattedUsers = validProfiles.map(profile => {
      const user = users.find(u => String(u._id) === String(profile.userId)) || {};
      const addresss = address.find(u => String(u.userId) === String(profile.userId)) || {};
      const equipments = devices.find(d => String(d.avatarId) === String(profile.userId)) || {};

      return {
        email: user.email || "N/A",           // Default value for missing email
        id: user._id || "N/A",                // Default value for missing user ID
        profile: user.profileimage || "N/A",  // Default value for missing profile image
        city: addresss.city || "N/A",         // Default value for missing city
        country: addresss.country || "N/A",   // Default value for missing country
        state: addresss.State || "N/A",       // Default value for missing state
        zipCode: addresss.zipCode || "N/A",   // Default value for missing zip code
        phoneNumber: addresss.mobileNumber || "N/A", // Default value for missing phone number
        phoneModel: equipments.device || "N/A", // Default value for missing device model
        Glimbal: equipments.glimble || "N/A", // Default value for missing glimble
        isAvatarapproved: user.isAvatarApproved || false, // Default approval status
        Name: user.userName || "N/A",         // Default value for missing user name
        lng: addresss.lng || "N/A",           // Default value for missing longitude
        lat: addresss.lat || "N/A"            // Default value for missing latitude
      };
    });

    // Calculate total items and total pages
    const totalItems = totaluserS;
    const totalPage = Math.ceil(totalItems / itemsPerPage);

    // Return the formatted data in the response
    return res.status(200).json({
      current_page: page,
      data: formattedUsers,
      success: true,
      items_per_page: itemsPerPage,
      message: "Successfully fetched all user profiles",
      total_items: totalItems,
      total_page: totalPage,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
      success: false,
    });
  }
};


export const getAvatarlocation = async (req, res) => {
  const adminrole = req.role;
  try { 
    if(adminrole==="admin"){
         
    const userProfiles = await userProfile.find({ role: "avatar" });

    // Extract userIds from userProfile
    const userIds = userProfiles.map(profile => profile.userId);

    // Find only those users who are present in the User model and match the email filter if provided
    const totalusers = await User.find({ _id: { $in: userIds } });
    const totaluserS = totalusers.length;

    // Paginate the users based on the provided page number and items per page
    const users = await User.find({ _id: { $in: userIds }})


    // Find addresses and devices for the filtered users, applying the address search filters
    const address = await Address.find({ userId: { $in: userIds }});
  
    const devices = await MobileDevices.find({ avatarId: { $in: userIds } });

    // Filter the user profiles to only include those where userId matches a valid User
    const validProfiles = userProfiles.filter(profile => 
      users.some(user => String(user._id) === String(profile.userId))
    );
    function addressIsValid(address) {
      return address.city && address.country && address.state && address.lng && address.lat;
    }
    // Format the final result for the response
    const formattedUsers = validProfiles.map(profile => {
      const user = users.find(u => String(u._id) === String(profile.userId));
      const addresss = address.filter(u => String(u.userId) === String(profile.userId));
    
      // Check if the address array has at least one entry
      const firstAddress = addresss.length > 0 ? addresss[0] : {};
    
      return {
        city: firstAddress.city || '',        // Use firstAddress to get city
        country: firstAddress.country || '',  // Use firstAddress to get country
        state: firstAddress.state || '',      // Use firstAddress to get state
    
        Name: user?.userName || '',           // Ensure user might be null
        lng: firstAddress.lng || 0,           // Use firstAddress for lng
        lat: firstAddress.lat || 0            // Use firstAddress for lat
      };
    });
    

    // Calculate total items and total pages


    // Return the formatted data in the response
    return res.status(200).json({
    
      data: formattedUsers,
      success: true,
    
    });
    }else{
      return res.status(404).json({message:"Not allowed"});
    }
   
    



  } catch (err) {
    return res.status(500).json({
      message: err.message,
      success: false,
    });
  }
};



export const searchAvatar = async (req, res) => {
  try {
    // Get the search query from the request query parameters
    const { query } = req.query;

    // Find profiles where the role is "avatar"
    const profiles = await userProfile.find({ role: "avatar" }).lean();

    const filteredProfiles = [];

    for (const profile of profiles) {
      // Fetch the associated User document
      const user = await User.findById(profile.userId).lean().select("_id userName email isAvatarApproved ");

      // Check if the query matches userName, email, or userId
      if (user && (user.userName.includes(query) || user.email.includes(query) || profile.userId.toString().includes(query))) {
        // Add only _id, username, and email to the filtered list
        filteredProfiles.push({
          _id: user._id,
          username: user.userName,
          email: user.email,
          isAvatarApproved: user.isAvatarApproved,
        });
      }
    }

    // Send the filtered profiles in the response
    return res.status(200).json({
      success: true,
      message: "Search results",
      data: filteredProfiles,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAvatar = async (req, res) => {
  try {
    // Check if the user has 'superadmin' role
    if (req.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete the avatar.",
      });
    }

    // Extract the avatar ID from the request parameters
    const { id } = req.params;

    // Log the provided ID for debugging
  

    // Validate the ID format (MongoDB ObjectId should be 24 characters long)
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format. It should be a 24-character hexadecimal string.",
      });
    }

    // Find the userProfile document to get the associated userId
    const profileToDelete = await userProfile.findById(id);

    if (!profileToDelete) {
      return res.status(404).json({
        success: false,
        message: "UserProfile not found.",
      });
    }

    // Extract the userId from the found userProfile document
    const { userId } = profileToDelete;

    // Delete the userProfile document
    await userProfile.findByIdAndDelete(id);

    // Delete the associated User document
    await User.findByIdAndDelete(userId);

    // Send success response
    return res.status(200).json({
      success: true,
      message: "UserProfile and associated User deleted successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
      success: false,
    });
  }
};

export const getAvatarById = async (req, res) => {
  try {
    // Extract the avatar ID from the request parameters
    const { id } = req.params;

    // Validate the ID format (assuming it's a MongoDB ObjectId)
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format.",
      });
    }

    // Find the userProfile document by ID, populate 'userId', and exclude specific fields
    const avatar = await userProfile
      .findById(id)
      .select("-password -confirmPassword -__v") // Exclude fields
      .populate("userId", "-password -confirmPassword -__v") // Exclude fields from populated userId
      .lean(); // Use lean() for faster read operations

    if (!avatar) {
      return res.status(404).json({
        success: false,
        message: "Avatar not found.",
      });
    }

    // Return the avatar data in the response
    return res.status(200).json({
      success: true,
      message: "Avatar record retrieved successfully.",
      data: avatar, // Return the full avatar document excluding specified fields
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
      success: false,
    });
  }
};

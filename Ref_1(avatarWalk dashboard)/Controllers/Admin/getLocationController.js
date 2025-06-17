import { Location } from "../../Models/Avatar/location.js";
import { User } from "../../Models/User/userModel.js";
export const getLocationsForMap = async (req, res) => {
    try {
      // Fetch all location records with non-null userId
      const locations = await Location.find({ userId: { $ne: null } }).lean();
      
      // Initialize an array to hold location data with user details
      const locationData = [];
  
      for (const location of locations) {
        // Find the associated user
        const user = await User.findById(location.userId).lean().select("userName email");
  
        // Check if user exists
        if (user) {
          // Add the location data along with user details
          locationData.push({
            lat: location.lat,
            lng: location.lng,
            userName: user.userName,
            email: user.email,
          });
        }
      }
  
      // Send the response
      return res.status(200).json({
        success: true,
        message: "Locations fetched successfully.",
        data: locationData,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
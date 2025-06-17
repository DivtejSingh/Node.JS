import { Request } from "../../Models/User/requestModel.js";
import { User } from "../../Models/User/userModel.js";
import { Report } from "../../Models/User/reportModel.js";
import { Experience } from "../../Models/Avatar/ExperienceModel.js";
import { Profile } from "../../Models/User/profileModel.js";
import { userProfile } from "../../Models/User/userProfile.js";
import { MobileDevices } from "../../Models/User/Mobilemodel.js";
import { Address } from "../../Models/User/addressModel.js";

export const GetAllRequest = async (req, res) => {
  try {
    // Get query parameters for pagination
    const { items_per_page = 10, pg = 1 } = req.query;
    // Convert items_per_page and pg to numbers
    const itemsPerPage = parseInt(items_per_page, 10);
    const page = parseInt(pg, 10);

    // Calculate the number of documents to skip
    const skip = (page - 1) * itemsPerPage;

    // Fetch all requests with pagination, filtering, and sorting
    const allRequests = await User.find({ isAvatarApproved: false })
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .skip(skip)
      .limit(itemsPerPage);

    const requestsWithDevicesAndProfileImage = await Promise.all(
      allRequests.map(async (user) => {
        // Fetch devices for the user
        const devices = await MobileDevices.find({ avatarId: user._id });

        // Fetch profile image from Addresses model
        const address = await  Address.findOne({ userId: user._id });
 
        return {
          ...user.toObject(), // Convert user to a plain object
          devices, // Add devices array
          profileImage: address?.profileimage || null, // Add profileImage from Addresses model
        };
      })
    );

    // Count the total number of documents
    const totalItems = await User.countDocuments({ isAvatarApproved: false });

    const totalPage = Math.ceil(totalItems / itemsPerPage);

    // Send the response
    return res.status(200).json({
      current_page: page,
      data: requestsWithDevicesAndProfileImage,
      success: true,
      items_per_page: itemsPerPage,
      message: "Requests retrieved successfully",
      total_items: totalItems,
      total_page: totalPage,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};




// change status of request 
export const UpdateRequestStatus = async (req, res) => {
  try {
    // Extract parameters from request
    const { requestId, status } = req.body;

    // Validate status
    if (![true, false].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    // Check if requestId and status are provided
    if (requestId == null || status == null) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and status are required.',
      });
    }

    let message;

    if (status) {
      // If status is true, update the request
      const updatedRequest = await User.findByIdAndUpdate(
        requestId,
        { isAvatarApproved: status },
        { new: true, runValidators: true }
      );

      if (!updatedRequest) {
        return res.status(404).json({
          success: false,
          message: 'Request not found.',
        });
      }

      message = 'Request is accepted.';
    } else {
      // If status is false, remove the request
      const deletedRequest = await User.findByIdAndDelete(requestId);

      if (!deletedRequest) {
        return res.status(404).json({
          success: false,
          message: 'Request not found.',
        });
      }

      message = 'Request is rejected ';
    }

    // Return the appropriate response
    return res.status(200).json({
      success: true,
      message: message,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




import { Admin } from "../../Models/Admin/AdminModel.js";
import { Experience } from "../../Models/Avatar/ExperienceModel.js";
import { Dispute } from "../../Models/User/DisputeModel.js";
import { Refund } from "../../Models/User/RefundModel.js";
import { Booking } from "../../Models/User/bookingModel.js";
import { User } from "../../Models/User/userModel.js";
import { Payment } from "../../Models/User/Payment.js";
import { Rating } from "../../Models/Avatar/ratingModel.js";
import { Request } from "../../Models/User/requestModel.js";




export const getAllExperience = async (req, res) => {
  try {
    // Get query parameters for pagination
    const { items_per_page = 10, pg = 1 } = req.query;
    // Convert items_per_page and pg to numbers
    const itemsPerPage = parseInt(items_per_page, 10);
    const page = parseInt(pg, 10);

    // Calculate the number of documents to skip
    const skip = (page - 1) * itemsPerPage;

    // Get total number of experiences
    const totalItems = await Experience.countDocuments({status:0});

    // Get paginated experiences, sorted by createdAt in descending order
    const experiences = await Experience.find({status: 0},{avatarId:0,avatarImage:0,images:0,AmountsperMinute:0,Reviews:0,notesForUser:0,status:0,likes:0,rating:0,isFeatured:0,avgRating:0,bookinstaltly:0,reportExp:0,lat:0,lng:0})
      .sort({ createdAt: -1 }) // Sort by createdAt field in descending order
      .skip(skip)
      .limit(itemsPerPage);

    // Calculate total number of pages
    const totalPage = Math.ceil(totalItems / itemsPerPage);

    // Send the response with all fields
    return res.status(200).json({
      current_page: page,
      data: experiences, // All details are included here
      success: true,
      items_per_page: itemsPerPage,
      message: "Successfully fetched all experiences",
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


// get the reviews 
export const getallreviews = async (req, res) => {
  const { id } = req.params;
  const adminrole = req.role;

  try {
    // Check if user is an admin
    if (adminrole === "admin") {
      // Fetch reviews for the given experience ID, excluding `AmmountTip`
      let findReviews = await Rating.find({ ExperienceId: id }, { AmmountTip: 0 });

      // Check if there are any reviews
      if (!findReviews || findReviews.length === 0) {
        return res.status(200).json({ message: "No reviews found",data:[], isSuccess: false });
      }

      // Format the review data
      const formatedData = findReviews.map(review => ({
        id: review._id,
        userImage: review.userImage,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        date: review.createdAt
      }));

      return res.status(200).json({
        message: "Successfully fetched",
        isSuccess: true,
        data: formatedData
      });
    } else {
      // If user is not authorized
      return res.status(403).json({ message: "Unauthorized", isSuccess: false });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};



export const searchExperiences = async (req, res) => {
    try {
        const { query } = req.query;
        
        // Ensure the query parameter is provided
        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Please provide a search query.",
            });
        }

        // Search for experiences that match the query in any of the specified fields
        const experiences = await Experience.find({
            $or: [
                { avatarName: { $regex: query, $options: "i" } },
                { ExperienceName: { $regex: query, $options: "i" } },
                { country: { $regex: query, $options: "i" } },
                { State: { $regex: query, $options: "i" } },
                { city: { $regex: query, $options: "i" } },
                { about: { $regex: query, $options: "i" } },
                { notesForUser: { $regex: query, $options: "i" } },
            ]
        })
        // console.log(experiences)
        // Return the search results
        return res.status(200).json({
            success: true,
            message: "Experiences fetched successfully.",
            data: experiences,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


export const deleteExperience = async (req, res) => {
  try {
    // Check if the user has 'superadmin' role
    if (req.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete the experience.',
      });
    }

    // Extract the experience ID from the request parameters
    const { id } = req.params;

    // Validate the ID format (assuming it's a MongoDB ObjectId)
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format.',
      });
    }

    // Find and delete the Experience document
    const deletedExperience = await Experience.findByIdAndDelete(id);

    if (!deletedExperience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found.',
      });
    }

    // Send success response
    return res.status(200).json({
      success: true,
      message: 'Experience deleted successfully.',
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
      success: false,
    });
  }
};

export const getExperienceById = async (req, res) => {
  try {
    // Extract the experience ID from the request parameters
    const { id } = req.params;

    // Validate the ID format (assuming it's a MongoDB ObjectId)
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format.',
      });
    }

    // Find the Experience document by ID
    const experience = await Experience.findById(id).lean(); // Use lean() for faster read operations

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found.',
      });
    }

    // Send the experience data in the response
    return res.status(200).json({
      success: true,
      message: 'Experience record retrieved successfully.',
      data: experience,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
      success: false,
    });
  }
};


// make a route to got all the experience which are cancelled 

export const getcancelledbyuser = async (req, res) => {
  const id = req.id;
  
  try {
    // Find the admin by ID
    const admin = await Admin.findOne({ _id: id });

    if (admin) {
      // Find all pending refunds
      let disputes = await Dispute.find({ status: 'Pending' });

      // Initialize an array to hold detailed refund information
      let detailedDisputes = [];

      // Iterate through each refund to find associated booking and experience details
      for (let refund of disputes) {
        // Find the booking related to this refund
        let booking = await Booking.findOne({ _id: refund.bookingId });
        let useremail = await User.findOne({_id:booking.avatarId})
        if (booking) {
          // Find the experience related to this booking
          let experience = await Experience.findOne({ _id: booking.packageIds });

          if (experience) {
            // Compile the detailed information for this refund
            detailedDisputes.push({
              DisputeId: refund._id,
              status: refund.status,
              reason: refund.reason,
              amount:refund.amount,
              cancelledBy: refund.Cancelledby,
              bookingId: booking._id,
              experienceName: experience.ExperienceName,
              City: experience.city,
              State: experience.State,  
              userName:experience.avatarName,  
              userEmail:useremail.email
            });
          }
        }
      }



      // Return the results in the response
      return res.status(200).json({ data: detailedDisputes ,success:true});
    }

  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: err.message, success: false });
  }
};


export const getcancelledbyavatar = async (req, res) => {
  const id = req.id;
  
  try {
    // Find the admin by ID
    const admin = await Admin.findOne({ _id: id });

    if (admin) {
      // Find all pending refunds
      let refunds = await Refund.find({ status: 'Pending' });

      // Initialize an array to hold detailed refund information
      let detailedRefunds = [];

      // Iterate through each refund to find associated booking and experience details
      for (let refund of refunds) {
        // Find the booking related to this refund
        let booking = await Booking.findOne({ _id: refund.bookingId });

        if (booking) {
          // Find the experience related to this booking
          let experience = await Experience.findOne({ _id: booking.packageIds });
          let useremail = await User.findOne({_id:booking.avatarId})

          if (experience) {
            // Compile the detailed information for this refund
            detailedRefunds.push({
              refundId: refund._id,
              status: refund.status,
              reason: refund.reason,
              amount:refund.amount,
              cancelledBy: refund.Cancelledby,
              bookingId: booking._id,
              experienceName: experience.ExperienceName,
              City: experience.city,
              State: experience.State,
              avatarName:experience.avatarName,  
              avatarEmail:useremail.email
              
            });
          }
        }
      }

    

      // Return the results in the response
      return res.status(200).json({ data: detailedRefunds ,success: true });
    }

  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: err.message, success: false });
  }
};


export const getCompletedAvatarstours = async (req, res) => {
  const id = req.id;
  
  try {
    // Find the admin by ID
    const admin = await Admin.findOne({ _id: id });

    if (admin) {
      // Find all completed bookings
      let completedBookings = await Booking.find({ status: 'Completed' });

      // Initialize an array to hold detailed avatar information
      let detailedAvatars = [];
      let totalPayoutAmount = 0;

      // Iterate through each completed booking to find associated experience and user details
      for (let booking of completedBookings) {
        // Find the experience related to this booking
        let experience = await Experience.findOne({ _id: booking.packageIds });
        let user = await User.findOne({ _id: booking.avatarId });

        if (experience && user) {
          // Find the payment related to this booking
          let payment = await Payment.findOne({ bookingId: booking._id });

          // Calculate the payout amount if payment is found
          if (payment) {
            totalPayoutAmount += payment.price;
          }

          // Compile the detailed information for this avatar
          detailedAvatars.push({
            bookingId: booking._id,
            experienceName: experience.ExperienceName,
            City: experience.city,
            State: experience.State,
            avatarName: user.userName,
            avatarEmail: user.email
          });
        }
      }



      // Return the results in the response
      return res.status(200).json({
        data: detailedAvatars,
        totalPayoutAmount: totalPayoutAmount,
        success: true
      });
    }

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message, success: false });
  }
};


export const deleteExperienceById = async (req, res) => {
  try {
    // Extract _id from request parameters
    const { id } = req.params;



    // Validate that id is provided
    if (!id) {
      return res.status(400).json({
        message: "Experience ID is required",
        success: false,
      });
    }

    // Find and delete the experience by _id
    const deletedExperience = await Experience.findByIdAndUpdate({_id:id},{status:1},{new:true});
    await Request.deleteMany({ packageId: id });

      // Delete associated bookings
      await Booking.deleteMany({ packageIds: id });
    // Check if the experience was found and deleted
    if (deletedExperience) {
      return res.status(200).json({
        message: "Experience successfully deleted",
        success: true,
      });
    } else {
      return res.status(404).json({
        message: "Experience not found",
        success: false,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};







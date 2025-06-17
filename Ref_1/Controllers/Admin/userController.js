import { Address } from "../../Models/User/addressModel.js";
import { User } from "../../Models/User/userModel.js";
import { userProfile } from "../../Models/User/userProfile.js";
import { Request } from "../../Models/User/requestModel.js";
import bcrypt from "bcrypt";
import moment from "moment";
import { ReportAvt } from "../../Models/User/Avatarreport.js";
import { Report } from "../../Models/User/reportModel.js";
const salt = 8;
export const GetallUsers = async (req, res) => {
  try {
    // Get query parameters for pagination and search filters
    const { items_per_page = 10, pg = 1, Name } = req.query;

    // Convert items_per_page and pg to numbers
    const itemsPerPage = parseInt(items_per_page, 10);
    const page = parseInt(pg, 10);

    // Calculate the number of documents to skip
    const skip = (page - 1) * itemsPerPage;

    // Build search filter for userName if provided
    const searchFilters = {};
    if (Name) {
      searchFilters.userName = { $regex: Name, $options: "i" }; // Case-insensitive userName search
    }

    // Find all user profiles with role 'user'
    const userProfiles = await userProfile.find({ role: "user" });

    // Extract userIds from userProfile
    const userIds = userProfiles.map(profile => profile.userId);

    // Find users that match the userName filter (if provided) and exist in the User model
    const totalusers = await User.find({ _id: { $in: userIds }, ...searchFilters });
    const totaluserS = totalusers.length;

    // Paginate the users
    const users = await User.find({ _id: { $in: userIds }, status: 0, ...searchFilters })
      .skip(skip)
      .limit(itemsPerPage);

    // Find addresses and related tours for the filtered users
    const address = await Address.find({ userId: { $in: userIds } });
    const tours = await Request.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", totalTours: { $sum: 1 } } } // Group by userId and count tours
    ]);

    // Filter the user profiles to only include those where userId matches a valid User
    const validProfiles = userProfiles.filter(profile => 
      users.some(user => String(user._id) === String(profile.userId))
    );

    // Format the final result for the response
    const formattedUsers = validProfiles.map(profile => {
      const user = users.find(u => String(u._id) === String(profile.userId));
      const roles = validProfiles.find(u => String(u.userId) === String(profile.userId));
      const addresss = address.find(u => String(u.userId) === String(profile.userId));
      const totaltours = tours.find(t => String(t._id) === String(profile.userId));
      const totalToursCount = totaltours ? totaltours.totalTours : 0; // Default to 0 if no tours found

      // If user or other fields are missing, assign "N/A" or default values
      return {
        userName: user?.userName || "N/A",
        email: user?.email || "N/A",
        id: user?._id || "N/A",
        profile: user?.profileimage || "N/A",
        role: roles?.role || "N/A",
        location: addresss?.country || "N/A",
        city: addresss?.city || "N/A",
        state: addresss?.State || "N/A",
        zipCode: addresss?.zipCode || "N/A",
        lastActive: user?.lastActive || "N/A",
        tours: totalToursCount || 0,
        block: user?.block || false,
        freeze: user?.Freeze || false
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



//  export const searchUsers = async (req, res) => {
//     try {
//         // Get the search query from the request query parameters
//         const { query } = req.query;
//         // If query is not provided, return an error
//         if (!query) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Please provide a search query.",
//             });
//         }

//         // Use regex for case-insensitive search in userName and email fields
//         const users = await User.find({
//             $or: [
//                 { userName: { $regex: query, $options: "i" } },
//                 { email: { $regex: query, $options: "i" } }
//             ]
//         });

//         const userProfiles = await userProfile.find({ role: "user" });
//         const userIds = userProfiles.map(profile => profile.userId);

//         // Find addresses and related tours for the filtered users
//         const addresses = await Address.find({ userId: { $in: userIds } }).select("userId country city state zipCode");
//         const tours = await Request.aggregate([
//             { $match: { userId: { $in: userIds } } },
//             { $group: { _id: "$userId", totalTours: { $sum: 1 } } }
//         ]);

//         // Create a mapping of userId to address and tours
//         const addressMap = {};
//         addresses.forEach(address => {
//             addressMap[address.userId] = address; // Map userId to address
//         });

//         const tourMap = {};
//         tours.forEach(tour => {
//             tourMap[tour._id] = tour.totalTours; // Map userId to total tours
//         });

//         // Format the result
//         const data = users.map(user => {
//             const profile = userProfiles.find(p => String(p.userId) === String(user._id));
//             const userAddress = addressMap[user._id] || {};
//             const totalToursCount = tourMap[user._id] || 0;

//             return {
//                 userName: user.userName || "N/A",
//                 email: user.email || "N/A",
//                 id: user._id || "N/A",
//                 profile: user.profileimage || "N/A",
//                 role: profile?.role || "N/A",
//                 location: userAddress.country || "N/A",
//                 city: userAddress.city || "N/A",
//                 state: userAddress.state || "N/A",
//                 zipCode: userAddress.zipCode || "N/A",
//                 lastActive: user.lastActive || "N/A",
//                 tours: totalToursCount,
//                 block: user.block || false,
//                 freeze: user.Freeze || false,
//             };
//         });

//         return res.status(200).json({
//             success: true,
//             message: "Search results",
//             data: data,
//             total_items: data.length,
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };


export const searchUsers = async (req, res) => {
  try {
      // Get the search query from the request query parameters
      const { query } = req.query;
      
      // If query is not provided, return an error
      if (!query) {
          return res.status(400).json({
              success: false,
              message: "Please provide a search query.",
          });
      }

      // Find all user profiles with role 'user'
      const userProfiles = await userProfile.find({ role: "user" });
      
      // Extract userIds from userProfile
      const userIds = userProfiles.map(profile => profile.userId);

      // Find addresses for the filtered users
      const addresses = await Address.find({ userId: { $in: userIds } });

      // Create a mapping of userId to address
      const addressMap = {};
      addresses.forEach(address => {
          addressMap[address.userId] = address; // Map userId to address
      });

      // Find users matching the name
      const usersByName = await User.find({
          userName: { $regex: query, $options: "i" }, // Case-insensitive search
          _id: { $in: userIds } // Ensure users are in userProfiles
      });

      // Find users matching the country in their address
      const matchingAddressUsers = addresses.filter(address =>
          address.country && address.country.match(new RegExp(query, "i"))
      ).map(address => address.userId);

      // Find users by the matching user IDs from the addresses
      const usersByCountry = await User.find({
          _id: { $in: matchingAddressUsers } // Ensure users are in the filtered address
      });

      // Combine the results
      const combinedUsers = [...usersByName, ...usersByCountry];
      const uniqueUserIds = new Set(combinedUsers.map(user => user._id));

      // Remove duplicates by user ID
      const finalUsers = combinedUsers.filter(user => uniqueUserIds.has(user._id) && uniqueUserIds.delete(user._id));

      // Create the data array with relevant information
      const data = finalUsers.map(user => {
          const userAddress = addressMap[user._id] || {};
          return {
              userName: user.userName || "N/A",
              email: user.email || "N/A",
              id: user._id || "N/A",
              profile: user.profileimage || "N/A",
              role: "user", // Assuming all fetched users are of role 'user'
              location: userAddress.country || "N/A",
              city: userAddress.city || "N/A",
              state: userAddress.state || "N/A",
              zipCode: userAddress.zipCode || "N/A",
              lastActive: user.lastActive || "N/A",
              block: user.block || false,
              freeze: user.Freeze || false,
          };
      });

      return res.status(200).json({
          success: true,
          message: "Search results",
          data: data,
          total_items: data.length,
      });
  } catch (error) {
      console.error(error);
      return res.status(500).json({
          success: false,
          message: error.message,
      });
  }
};



 export const deleteUser = async (req, res) => {
  const {id} = req.params;
  const{status}=req.body;
  const role = req.role;
    try{ 
      if(role==="admin"){
        let usergot = await User.findOne({_id:id});
       if(usergot){
        let finduser = await User.findOneAndUpdate({_id:id},{status:status},{new:true});
        return res.status(200).json({message:"User deleted",isSuccess:true});
       }
       else{
        return res.status(404).json({message:"User not found",isSuccess:false})

       }
      }



    }catch(err){
      console.log(err);
      return res.status(404).json({message:err.message,isSuccess:false})
    }
    
  };
  


  export const Edituser = async (req, res) => {
    const { id } = req.params;
    const {
      firstName, lastName, userName, phoneNumber, email, role, dateOfBirth,
      password, confirmPassword, shortInfo, country, state, city, postalCode,
      lat, lng, description
    } = req.body;
  
    const adminRole = req.role;
  
    try {
      if (adminRole === "admin") {
        let findUser = await User.findOne({ _id: id });
  
        if (findUser) {
          // Check if passwords match
          if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
          } else {
            // Use the existing profile image if no new image is uploaded
            const profileImage = req.file ? req.file.path : findUser.profileimage;
  
            // Hash the password if a new password is provided
            const hashedPassword = password ? bcrypt.hashSync(password, salt) : findUser.password;
  
            // Update the user profile
            const updateUser = await User.findOneAndUpdate(
              { _id: id },
              {
                userName: userName,
                email: email,
                password: hashedPassword,
                confirmPassword: hashedPassword,
                profileimage: profileImage,
                Activeprofile: role,
                Viewpassword:password
              },
              { new: true }
            );
  
            // Update the role

   if(role==="avatar"){
    const updaterole = await userProfile.findOne({userId:id,role:"avatar"});
    if(!updaterole){
      let newrole = new userProfile({
        userId:id,
        role:role,
        avatarcommission:25
      })
      await newrole.save();
    }

   }
   else if(role==="user"){
    const updaterole = await userProfile.findOne({userId:id,role:"user"});
    if(!updaterole){
      let newrole = new userProfile({
        userId:id,
        role:role,
        usercommission:15
      })
      await newrole.save();
   }
  }

          
            const updateAddress = await Address.findOneAndUpdate(
              { userId: id },
              {
                country: country,
                city: city,
                State: state,
                zipCode: postalCode,
                lat: lat,
                lng: lng,
                profileimage: profileImage,
                firstName: firstName,
                lastName: lastName,
                mobileNumber: phoneNumber,
                dob: dateOfBirth,
                about: shortInfo,
                description: description
              },
              { new: true }
            );
  
            return res.status(200).json({ message: "Successfully updated the user", isSuccess: true });
          }
        } else {
          return res.status(404).json({ message: "User not found", isSuccess: false });
        }
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: err.message, isSuccess: false });
    }
  };
  

  export const getUserById = async (req, res) => {
    try {
      // Extract the user ID from the request parameters
      const {id} = req.params;
  
      // Validate the ID format (assuming it's a MongoDB ObjectId)
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ID format.',
        });
      }
  
      // Find the User document by ID
      const user = await User.findById(id).select('-password -confirmPassword -__v').lean(); // Use lean() for faster read operations
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }
  
      // Send the user data in the response
      return res.status(200).json({
        success: true,
        message: 'User record retrieved successfully.',
        data: user,
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message,
        success: false,
      });
    }
  };

  export const addUser = async(req,res)=>{
    const{firstName,lastName,userName
      ,phoneNumber,email,role,dateOfBirth,password,confirmPassword,description,shortInfo,country,state,city,postalCode,lat,lng} = req.body;
      const profileImage = req.file ? req.file.path : '';
    const tokenrole = req.role;

    try{
     if(tokenrole==="admin"){
      let findemail = await User.findOne({ email: email });
      let username = await User.findOne({ userName: userName});
      if (username) {
        console.lof
        return res.status(404).json({ message: "User name Already Exist Please Choose another Name" });
      }
      if (findemail) {
        return res.status(404).json({ message: "Email Already Exists Please select another Email" });
      }

      if(password!==confirmPassword){
        return res.status(400).json({ message: "Passwords do not match" });
      }else{
        //save the userInfo
        let haspass = bcrypt.hashSync(password, salt);

        let newUser = new User({
          userName: userName,
          email: email,
          password: haspass,
          confirmPassword: haspass,
          profileimage: profileImage,
          Viewpassword:password
        });
        let doc = await newUser.save();
       //store the Role
       let newProfile = new userProfile({
        userId:doc._id,
        role:role
      })
      let saverole = await newProfile.save();
       if(role==="user"){
        saverole.usercommission=15;
        await saverole.save();
       }
  if(role==="avatar"){
    saverole.avatarcommission=25;
    newUser.isAvatarApproved=true;
    await newUser.save();
        await saverole.save();
  }
       //now save the Address info
        let newAddress = new Address({
          firstName:firstName || " ",
          lastName:lastName || " ",
           userId:doc._id || " ",
           country:country || " ",
           city:city || " ",
           State:state || " ",
           zipCode:postalCode || " ",
           mobileNumber:phoneNumber || " ",
           dob:dateOfBirth || " ",
           about:shortInfo || " ",
           lat:lat,
           lng:lng,
           profileimage:profileImage,
           description:description
        })
        let address  = await newAddress.save();
       
        return res.status(200).json({message:"Successfully Created A New User",isSuccess:true});

      }
     }else{
     
      return res.status(404).json({message:"Unauthorized",isSuccess:false});

     }
    }catch(err){
      console.log(err.message);
      return res.status(404).json({message:err.message,isSuccess:false})
      
    }
  }

  export const getuserId = async(req,res)=>{
    const {id}=req.params;
    try{
         let finduser = await User.findOne({_id:id});
         if(finduser){
              //get the user info from the user table
      const findUserinfo = await User.findOne({_id:id},{_id:0,password:0,confirmPassword:0,status:0,isAvatarApproved:0,reportAvatar:0,profileimage:0,isgoogleSignup:0,isAppleSignup:0,isEmailsignup:0});
      //get the role info from the userProfile table
      const findroleinfo = await userProfile.findOne({userId:id},{isApproved:0,usercommission:0,avatarcommission:0,_id:0,userId:0});

      // get the addressifo from the Address
      const addressinfo = await Address.findOne({userId:id},{_id:0,userId:0,status:0,lat:0,lng:0});
       return res.status(200).json({message:"Successfully fetched",data:{userinfo:findUserinfo,profile:addressinfo,role:findroleinfo},isSuccess:true})
         }
         else{
     
          return res.status(404).json({message:"No such user found",isSuccess:false})
         }

    }catch(err){
      console.log(err.message);
      return res.status(404).json({message:err.message,isSuccess:false})
    }
  }

  //get all the commission

  export const getcommission = async (req, res) => {
    const adminrole = req.role;
    try {
      const { items_per_page = 10, pg = 1 } = req.query;
      const itemsPerPage = parseInt(items_per_page, 10);
      const page = parseInt(pg, 10);
  
      const skip = (page - 1) * itemsPerPage;
  
      if (adminrole === "admin") {
        let usercommission = await userProfile.find({}) || []; // Fetch all user profiles or set an empty array
        let userIds = usercommission.map(profile => profile.userId); // Extract all user IDs
  
        let totalusers = await User.find({ _id: { $in: userIds } }) || []; // Ensure result is an array
        let totaldata = totalusers.length;
  
        let findusers = await User.find({ _id: { $in: userIds } })
          .skip(skip)
          .limit(itemsPerPage) || []; // Ensure result is an array
  
        const address = await Address.find({ userId: { $in: userIds } }) || []; // Ensure result is an array
  
        // Create a mapping of commissions based on userId
        const userCommissionMap = usercommission.reduce((acc, profile) => {
          if (!acc[profile.userId]) {
            acc[profile.userId] = { asUser: null, asAvatar: null };
          }
          if (profile.role === "user") {
            acc[profile.userId].asUser = profile.usercommission; // Set user commission
          }
          if (profile.role === "avatar") {
            acc[profile.userId].asAvatar = profile.avatarcommission; // Set avatar commission
          }
          return acc;
        }, {});
  
        const totalItems = totaldata;
        const totalPage = Math.ceil(totalItems / itemsPerPage);
  
        // Format the response by combining user and avatar commissions
        const formattedUsers = findusers.map(user => {
          const commission = userCommissionMap[user._id] || {}; // Ensure commission object exists
          const useradd = address.find(u => String(u.userId) === String(user._id)) || {}; // Ensure address object exists
          const { firstName = " ", lastName = " " } = useradd;
  
          return {
            id: user?._id,
            userName: user?.userName || "-", // Handle missing userName
            FirstName: firstName,
            LastName: lastName,
            profile: user?.profileimage || "-", // Handle missing profile image
            asUser: commission.asUser || "-", // Handle missing commission as user
            asAvatar: commission.asAvatar || "-" // Handle missing commission as avatar
          };
        });
  
        return res.status(200).json({
          current_page: page,
          data: formattedUsers,
          success: true,
          items_per_page: itemsPerPage,
          message: "Successfully fetched all user profiles",
          total_items: totalItems,
          total_page: totalPage,
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: err.message, isSuccess: false });
    }
  };
  

  export const updateCommission = async (req, res) => {
    const adminrole = req.role;
    const { userId, newUserCommission, newAvatarCommission } = req.body;
  
    try {
      if (adminrole !== "admin") {
        return res.status(403).json({ message: "Unauthorized access", isSuccess: false });
      }
  
      // Fetch the user profile(s) for the given userId
      let userProfileRecords = await userProfile.find({ userId });
  
      if (userProfileRecords.length === 0) {
        return res.status(404).json({ message: "User profile not found", isSuccess: false });
      }
  
      // Update the user commission if the role is "user"
      const userUpdate = userProfileRecords.find(profile => profile.role === "user");
      if (userUpdate) {
        userUpdate.usercommission = newUserCommission; // Update user commission
        await userUpdate.save();
      }
  
      // Update the avatar commission if the role is "avatar"
      const avatarUpdate = userProfileRecords.find(profile => profile.role === "avatar");
      if (avatarUpdate) {
        avatarUpdate.avatarcommission = newAvatarCommission; // Update avatar commission
        await avatarUpdate.save();
      }
  
      return res.status(200).json({
        message: "Commissions updated successfully",
        isSuccess: true
      });
  
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: err.message, isSuccess: false });
    }
  };


  //report avatar
  export const avatarreport = async (req, res) => {
    const adminrole = req.role;
    
    try {
      const { items_per_page = 10, pg = 1 } = req.query;
      const itemsPerPage = parseInt(items_per_page, 10);
      const page = parseInt(pg, 10);
  
      const skip = (page - 1) * itemsPerPage;
  
      if (adminrole === "admin") {
        // Apply pagination directly to the ReportAvt collection
        let findReport = await ReportAvt.find({})
          .skip(skip)
          .limit(itemsPerPage);
   
        let userId = findReport.map((profile) => profile.userId);
        let avatarId = findReport.map((profile) => profile.avatarID);
  
        // Fetch all users and avatars related to the reports
        let totalUsers = await User.find({ _id: { $in: userId } });
        let totalData = await ReportAvt.countDocuments(); // Get total number of reports
  
        const users = await User.find({ _id: { $in: userId } });
        const avts = await User.find({ _id: { $in: avatarId } });
        const addresses = await Address.find({ userId: { $in: userId } });
        
        // Fetch the last report for each user
        const lastReports = await ReportAvt.find({ userId: { $in: userId } })
          .sort({ createdAt: -1 })
          .limit(1);
  
        const totalItems = totalData;
        const totalPage = Math.ceil(totalItems / itemsPerPage);
  
        // Filter and format the profiles
        const formattedUsers = findReport.map((profile) => {
          const user = users.find((u) => String(u._id) === String(profile.userId));
          const address = addresses.find((u) => String(u.userId) === String(profile.userId));
          const avatardetail = avts.find((u) => String(u._id) === String(profile.avatarID));
  
          const lastReport = lastReports.find((r) => String(r.userId) === String(profile.userId));
          let report = "";
  
          // Set the report type
          if (lastReport?.Scamming === true) {
            report = "Scamming";
          }
          if (lastReport?.Offensive === true) {
            report = "Offensive";
          }
          if (lastReport?.SomethingElse === true) {
            report = "SomethingElse";
          }
  
          return {
            reportId: profile._id,
            id: user?._id,
            userName: user?.userName,
            userProfile: address?.profileimage,
            lastReport: report,
            avatarName: avatardetail?.userName,
            avatarProfile: avatardetail?.profileimage,
          };
        });
  
        return res.status(200).json({
          current_page: page,
          data: formattedUsers,
          success: true,
          items_per_page: itemsPerPage,
          message: "Successfully fetched all user profiles",
          total_items: totalItems,
          total_page: totalPage,
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(404).json({ message: err.message, isSuccess: false });
    }
  };
  

export const avtarReportQuery = async (req, res) => {
  const adminrole = req.role;

  try {
      const { items_per_page = 10, pg = 1, query } = req.query; // Include items_per_page, pg, and query
      const itemsPerPage = parseInt(items_per_page, 10);
      const page = parseInt(pg, 10);
      const skip = (page - 1) * itemsPerPage;

      // Check for admin role
      if (adminrole === "admin") {
          // If query is not provided, return an error
          if (!query) {
              return res.status(400).json({
                  success: false,
                  message: "Please provide a search query.",
              });
          }

          // Fetch all reports and apply pagination
          let findReport = await ReportAvt.find({})
              .skip(skip)
              .limit(itemsPerPage);
       

          let userId = findReport.map((profile) => profile.userId);
          let avatarId = findReport.map((profile) => profile.avatarID);

          // Fetch all users and avatars related to the reports
          const users = await User.find({ _id: { $in: userId } });
          const avts = await User.find({ _id: { $in: avatarId } });
          const addresses = await Address.find({ userId: { $in: userId } });

          // Filter the reports based on the search query
          findReport = findReport.filter(profile => {
              const user = users.find(u => String(u._id) === String(profile.userId));
              const avatar = avts.find(a => String(a._id) === String(profile.avatarID));
              return (
                  user?.userName.toLowerCase().includes(query.toLowerCase()) ||
                  avatar?.userName.toLowerCase().includes(query.toLowerCase())
              );
          });

          const totalItems = findReport.length; // Update totalItems based on filtered results
          const totalPage = Math.ceil(totalItems / itemsPerPage);

          // Fetch the last report for each user
          const lastReports = await ReportAvt.find({ userId: { $in: userId } })
              .sort({ createdAt: -1 })
              .limit(1);

          // Filter and format the profiles
          const formattedUsers = findReport.map((profile) => {
              const user = users.find((u) => String(u._id) === String(profile.userId));
              const address = addresses.find((u) => String(u.userId) === String(profile.userId));
              const avatardetail = avts.find((u) => String(u._id) === String(profile.avatarID));

              const lastReport = lastReports.find((r) => String(r.userId) === String(profile.userId));
              let report = "";

              // Set the report type
              if (lastReport?.Scamming === true) {
                  report = "Scamming";
              }
              if (lastReport?.Offensive === true) {
                  report = "Offensive";
              }
              if (lastReport?.SomethingElse === true) {
                  report = "SomethingElse";
              }

              return {
                  reportId: profile._id,
                  id: user?._id,
                  userName: user?.userName,
                  userProfile: address?.profileimage,
                  lastReport: report,
                  avatarName: avatardetail?.userName,
                  avatarProfile: avatardetail?.profileimage,
              };
          });

          return res.status(200).json({
              current_page: page,
              data: formattedUsers,
              success: true,
              items_per_page: itemsPerPage,
              message: "Successfully fetched user profiles matching the search criteria",
              total_items: totalItems,
              total_page: totalPage,
          });
      }
  } catch (err) {
      console.log(err);
      return res.status(404).json({ message: err.message, isSuccess: false });
  }
};

  
  
  export const expreport = async(req,res)=>{
    const adminrole  = req.role;

    try{
      const{items_per_page=10,pg=1} = req.query;
      const itemsPerPage = parseInt(items_per_page, 10);
      const page = parseInt(pg, 10);

      const skip = (page - 1) * itemsPerPage;

      if(adminrole==="admin"){
        let findReport = await Report.find({}).skip(skip).limit(itemsPerPage);

        let reportArray=findReport.map(report=>report._id);

        let userId = findReport.map(profile=>profile.userId);
        let avatarId  = findReport.map(profile=>profile.avatarId);

      
        const users = await User.find({ _id: { $in: userId}});
        const avts = await User.find({_id:{$in:avatarId}});
  
      
        const addresss = await Address.find({userId:{$in:userId}});
     const lastReport = await Report.find({userId:{$in:userId}}).sort({createdAt:-1}).limit(1);

 const totaldata = await Report.countDocuments();
        const validProfiles = findReport.filter(profile => 
          users.some(user => String(user._id) === String(profile.userId))
        );
      let report;
      const totalItems = totaldata;
      const totalPage = Math.ceil(totalItems / itemsPerPage);
        const formattedUsers = validProfiles.map((profile,index) => {
          const user = users.find(u => String(u._id) === String(profile.userId));
          const address = addresss.find(u=>String(u.userId)===String(profile.userId));
          const avatardetail = avts.find(u=>String(u._id)===String(profile.avatarId));
          
          const lreport = lastReport.find(u=>String(u.userId)===String(profile.userId));
      
       if(lreport){
        switch (true) {
          case lreport.SexualContent === true:
            report = "SexualContent";
            break;
          case lreport.VoilentContent === true:
            report = "ViolentContent";
            break;
          case lreport.AbusiveContent === true:
            report = "AbusiveContent";
            break;
          case lreport.DangerousContent === true:
            report = "DangerousContent";
            break;
          case lreport.SpamContent === true:
            report = "SpamContent";
            break;
          default:
            report = " "; // Fallback case if none of the above are true
        }
       }else{
        report =" "
      }
          return {
            reportId:reportArray[index],
            id:user?._id,
            userName:user?.userName,
            userProfile:address?.profileimage,
            lastReport:report,
            avatarName:avatardetail?.userName,
            avatarProfile:avatardetail?.profileimage
                
          };
        });
        return res.status(200).json({
          current_page: page,
          data: formattedUsers,
          success: true,
          items_per_page: itemsPerPage,
          message: "Successfully fetched all user profiles",
          total_items: totalItems,
          total_page: totalPage,
        });
      }

    }catch(err){
      console.log(err);
      return res.status(404).json({message:err.message,isSuccess:false})
    } 
  }


  

  export const experienceReportQuery = async (req, res) => {
    const adminrole = req.role;

    try {
        const { items_per_page = 10, pg = 1, query } = req.query; // Include items_per_page, pg, and query
        const itemsPerPage = parseInt(items_per_page, 10);
        const page = parseInt(pg, 10);
        const skip = (page - 1) * itemsPerPage;

        // Check for admin role
        if (adminrole === "admin") {
            // If query is not provided, return an error
            if (!query) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a search query.",
                });
            }

            // Fetch all reports and apply pagination
            let findReport = await Report.find({})
                .skip(skip)
                .limit(itemsPerPage);
       

            let userId = findReport.map((profile) => profile.userId);
            let avatarId = findReport.map((profile) => profile.avatarId);

            // Fetch all users and avatars related to the reports
            const users = await User.find({ _id: { $in: userId } });
            const avts = await User.find({ _id: { $in: avatarId } });
            const addresses = await Address.find({ userId: { $in: userId } });

            // Filter reports based on the search query
            findReport = findReport.filter(profile => {
                const user = users.find(u => String(u._id) === String(profile.userId));
                const avatar = avts.find(a => String(a._id) === String(profile.avatarId));
                return (
                    user?.userName.toLowerCase().includes(query.toLowerCase()) ||
                    avatar?.userName.toLowerCase().includes(query.toLowerCase())
                );
            });

            const totalItems = findReport.length; // Update totalItems based on filtered results
            const totalPage = Math.ceil(totalItems / itemsPerPage);

            // Fetch the last report for each user
            const lastReports = await Report.find({ userId: { $in: userId } })
                .sort({ createdAt: -1 })
                .limit(1);

            // Filter and format the profiles
            const formattedUsers = findReport.map((profile) => {
                const user = users.find((u) => String(u._id) === String(profile.userId));
                const address = addresses.find((u) => String(u.userId) === String(profile.userId));
                const avatardetail = avts.find((u) => String(u._id) === String(profile.avatarId));

                const lreport = lastReports.find((u) => String(u.userId) === String(profile.userId));
                let report = "";

                // Set the report type
                if (lreport) {
                    if (lreport.SexualContent) {
                        report = "SexualContent";
                    } else if (lreport.ViolentContent) {
                        report = "ViolentContent";
                    } else if (lreport.AbusiveContent) {
                        report = "AbusiveContent";
                    } else if (lreport.DangerousContent) {
                        report = "DangerousContent";
                    } else if (lreport.SpamContent) {
                        report = "SpamContent";
                    }
                }

                return {
                    id: user?._id,
                    userName: user?.userName,
                    userProfile: address?.profileimage,
                    lastReport: report,
                    avatarName: avatardetail?.userName,
                    avatarProfile: avatardetail?.profileimage,
                };
            });

            return res.status(200).json({
                current_page: page,
                data: formattedUsers,
                success: true,
                items_per_page: itemsPerPage,
                message: "Successfully fetched user profiles matching the search criteria",
                total_items: totalItems,
                total_page: totalPage,
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(404).json({ message: error.message, isSuccess: false });
    }
};


export const experienceDeleteQuery=async(req,res)=>{
  try {
    const{id}=req.params

    if (!id) {
      return res.status(400).json({
        message: "Report Experience ID is required",
        success: false,
      });
    }
    const deleteReportExp=await Report.findByIdAndDelete(id)

    if (deleteReportExp) {
      return res.status(200).json({
        message: "Report Experience removed successfully",
        success: true,
      });
    } else {
      return res.status(404).json({
        message: "Report Experience not found",
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
}
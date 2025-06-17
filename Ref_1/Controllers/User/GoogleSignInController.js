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
import { Chat } from "../../Models/User/ChatModel.js";
import { Payment } from "../../Models/User/Payment.js";
import { ReportAvt } from "../../Models/User/Avatarreport.js";
import { adminNotificationSuccess, userAddedSuccess } from "../../services/CreateEmail.js";
import { sendEmail } from "../../services/EmailServices.js";

export const SignUpAndLoginWithGoogle = async (req, res) => {
  const { uid, profileImage, email, userName, isgoogleSignup,isEmailsignup,isAppleSignup } = req.body;
  // Validate UID

  if (!uid) {
    return res.status(400).send({ message: "Please Provide UID" });
  }

  try {
    // Find user by UID
    let user = await User.findOne({ uid });
 

    // If user exists, perform login checks
    if (user) {
      // Check if user can log in based on their status
      if (user.status !== 0) {
        return res.status(403).json({ message: "User cannot login", isSuccess: false });
      }

      // Fetch user profiles
      let profiles = await userProfile.find({ userId: user._id });
      let totalProfile = profiles.length;


      if (user.Activeprofile) {
        // Role is already set, no need to ask for role again
        if (user.Activeprofile === "avatar" && !user.isAvatarApproved) {
          return res.status(403).json({
            // message: "Request is still pending to become an avatar",
            isSuccess: false,
          });
        }
  

        user.Online = true;
        await user.save();
        user.__v = undefined;
        user.profileimage = undefined;
        user.Viewpassword=undefined;
       user.reportAvatar=undefined;
       user.action=undefined;
       user.status=undefined;
       user.block=undefined;
       user.Freeze=undefined;
       user.action=undefined;
       user.lastActive=undefined;
       user.Online=undefined;
       user.password=undefined;
       user.confirmPassword=undefined;
  
        // Create JWT token
        const token = jwt.sign({ data: user, role: user.Activeprofile }, process.env.KEY);
        res.cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
        });
  
        // Hide sensitive data
     
  
        // Fetch user address with default values if missing
        let userAdd = (await Address.findOne({ userId: user._id })) || {};
        const { country = "", city = "",State="", profileimage = "", firstName = "", lastName = "", mobileNumber = "", dob = "" } = userAdd;
  
        return res.status(200).json({
          message: `Login successful as ${user.Activeprofile}`,
          data: {
            _id: user._id,
            userName: user.userName,
            email: user.email,
            terms: user.terms,
            status: user.status,
            Activeprofile: user.Activeprofile,
            Online: user.Online,
            isbooked: user.isbooked,
            Country: country,
            City: city,
            State:State,
            profileimage:user.profileimage,
            firstName,
            lastName,
            mobileNumber,
            dob,
            totalprofile: totalProfile,
          },
          token,
          isSuccess: true,
        });
      }

      // Handle multiple profiles
      if (totalProfile > 1) {
        user.action = "login";
        await user.save();

        if (!req.body.role) {
          return res.status(200).json({
            message: "Multiple profiles exist",
            action: "login",
            data: profiles,
            isSuccess: true,
          });
        }

        let validProfile = await userProfile.findOne({
          userId: user._id,
          role: req.body.role,
        });

        if (!validProfile) {
          return res.status(404).json({ message: "Invalid role selected", isSuccess: false });
        }

        // Save the selected role even if it is not approved
        user.Activeprofile = req.body.role;

        // Check if avatar role is not approved
        if (req.body.role === "avatar" && !user.isAvatarApproved) {
          await user.save();
          return res.status(403).json({
            // message: "Request is still pending to become an avatar",
            isSuccess: false,
          });
        }

        user.batch = 1;
        await user.save();

        // Create JWT token
        const token = jwt.sign({ data: user, role: user.Activeprofile }, process.env.KEY);
        res.cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
        });

        // Hide sensitive data
        user.password = undefined;
        user.confirmPassword = undefined;
        user.__v = undefined;
        user.action = undefined;

        // Fetch user address with default values if missing
        let userAdd = (await Address.findOne({ userId: user._id })) || {};
        const { country = "", city = "",State="", profileimage = "", firstName = "", lastName = "", mobileNumber = "", dob = "" } = userAdd;

        return res.status(200).json({
          message: `Login successful as ${req.body.role}`,
          data: {
            _id: user._id,
            userName: user.userName,
            email: user.email,
            terms: user.terms,
            status: user.status,
            Activeprofile: user.Activeprofile,
            batch: user.batch,
            isbooked: user.isbooked,
            Country: country,
            City: city,
            State:State,
            profileimage:user.profileimage,
            firstName,
            lastName,
            mobileNumber,
            dob,
            action: "login",
            totalProfile,
          },
          token,
          isSuccess: true,
        });
      }

      // Handle single profile
      if (totalProfile === 1) {
        let userProfile = profiles[0];
        user.batch = 1;
        user.Activeprofile = userProfile.role;

        // Save the selected role even if it is not approved
        if (user.Activeprofile === "avatar" && !user.isAvatarApproved) {
          await user.save();
          return res.status(403).json({
            // message: "Request is still pending to become an avatar",
            isSuccess: false,
          });
        }

        await user.save();

        const token = jwt.sign({ data: user, role: user.Activeprofile }, process.env.KEY);
        res.cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
        });

        // Hide sensitive data
        user.password = undefined;
        user.confirmPassword = undefined;
        user.__v = undefined;
        user.action = undefined;

        // Fetch user address with default values if missing
        let userAdd = (await Address.findOne({ userId: user._id })) || {};
        const { country = "", city = "",State="", profileimage = "", firstName = "", lastName = "", mobileNumber = "", dob = "" } = userAdd;

        return res.status(200).json({
          message: "Login successful",
          token,
          data: {
            _id: user._id,
            userName: user.userName,
            email: user.email,
            terms: user.terms,
            status: user.status,
            Activeprofile: user.Activeprofile,
            batch: user.batch,
            isbooked: user.isbooked,
            Country: country,
            City: city,
            State:State,
            profileimage:user.profileimage,
            firstName,
            lastName,
            mobileNumber,
            dob,
            action: "login",
          },
          isSuccess: true,
        });
      }
    } else {

  

      if (!email) {
        return res.status(400).json({ message: "Please Provide Email Address", isSuccess: false });
      }
    
      let findemail = await User.findOne({ email: email });
      let username = await User.findOne({ userName: userName });
     

      if (findemail) {
         findemail.uid =uid;
         await findemail.save();
      }
  
      let newUser = new User({
        userName: userName,
        email: email,
        uid: uid,
        profileimage: profileImage,
        isgoogleSignup: isgoogleSignup ,
        isAppleSignup:isAppleSignup,
        action: "registration",
        password:'',
        confirmPassword:''
      });

      let doc = await newUser.save();
      doc.__v = undefined;
      sendEmail(email,"Your Account created Successfully",userAddedSuccess(newUser))
      sendEmail(process.env.EMAIL_USER,"A  New User Sign up",adminNotificationSuccess(newUser))

      return res.status(201).json({
        message: "Register successfully",
        data: {
          Activeprofile: doc.Activeprofile,
          _id: doc._id,
          uid: doc.uid || "",
          userName: doc.userName,
          email: doc.email,
          profileimage: doc.profileimage,
          action: "registration",
          totalProfile: 1,
          isgoogleSignup: doc.isgoogleSignup ,
        isAppleSignup:doc.isAppleSignup,
        },
      
        isSuccess: true,
      });
    }
  } catch (error) {
    console.error("Error during Google login:", error);
    res.status(500).json({ message: error.message });
  }
};

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
import { TourInfo } from "../../Models/User/TourInfo.js";
import { ReportAvt } from "../../Models/User/Avatarreport.js";
import moment from "moment";
import { MobileDevices } from "../../Models/User/Mobilemodel.js";
import { multipleAdd } from "../../Models/User/MultipleAdd.js";
import { createEmailHtml ,createAvatarRequestEmail, userAddedSuccess, adminNotificationSuccess, createBugReportEmailHtml} from "../../services/CreateEmail.js";
import { Admin } from "../../Models/Admin/AdminModel.js";
import { Account } from "../../Models/User/Account.js";
import { sendEmail } from "../../services/EmailServices.js";
import { Notification } from "../../Models/User/NotificationModel.js";
import { uploadFileToS3 } from "../../Middleware/uploadfiles3.js";

const salt = 8;

//add user

export const AddUser = async (req, res) => {
  const { uid, userName, email, password, confirmPassword, terms, isgoogleSignup } = req.body;



let profileImage="";
  try {
 if (req.files.images) {
      const profile = req.files.images[0];
      const fileName = `${Date.now()}_${profile.originalname}`;
      const folder = 'images';

      // Set S3 path
      profileImage = `https://awcdn.s3-accelerate.amazonaws.com/${folder}/${fileName}`;
   
      // Background upload
      uploadFileToS3(profile.path, fileName, folder).catch((err) =>
        console.error('Image upload failed:', err)
      );
    }





    let findemail = await User.findOne({ email: email });
    let username = await User.findOne({ userName: userName });
    if (username) {
      return res.status(404).json({ message: "User name Already Exist" });
    }
    if (findemail) {
      return res.status(404).json({ message: "Email Already Exists" });
    }
    if (isgoogleSignup) {
      let newUser = new User({
        userName: userName,
        email: email,
        uid: uid,
        profileimage: profileImage,
        isgoogleSignup: isgoogleSignup,
        action: "registration",
      });
      let doc = await newUser.save();
      doc.__v = undefined;
      doc.profileimage = undefined;
      doc.Viewpassword=undefined;
     doc.reportAvatar=undefined;
     doc.action=undefined;
     doc.status=undefined;
     doc.block=undefined;
     doc.Freeze=undefined;
     doc.action=undefined;
     doc.lastActive=undefined;
     doc.Online=undefined;
     doc.password=undefined;
     doc.confirmPassword=undefined;


      const token = jwt.sign({ data: doc }, process.env.KEY);
      return res.status(201).json({
        message: "Successfully registered",
        data: doc,
        isSucces: true,
        token: token,
      });
    } else {
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      } else {
        let hashpass = bcrypt.hashSync(password, salt);
        let newUser = new User({
          userName: userName,
          email: email,
          password: hashpass,
          confirmPassword: hashpass,
          Viewpassword:password,
          terms: terms,
          action: "registration",
          profileimage: profileImage
        });

        let doc = await newUser.save();
        doc.__v = undefined;
        doc.profileimage = undefined;
        doc.Viewpassword=undefined;
       doc.reportAvatar=undefined;
       doc.action=undefined;
       doc.status=undefined;
       doc.block=undefined;
       doc.Freeze=undefined;
       doc.action=undefined;
       doc.lastActive=undefined;
       doc.Online=undefined;
       doc.password=undefined;
       doc.confirmPassword=undefined;
  
        const token = jwt.sign({ data: doc }, process.env.KEY);
        res.cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
        });
        let Accessnoti = new Notification({
          userId:doc._id
  
        })
        await Accessnoti.save();
        sendEmail(email,"Your Account created Successfully",userAddedSuccess(newUser))
        sendEmail(process.env.Email_User,"A  New User Sign up",adminNotificationSuccess(newUser))
        return res.status(201).json({
          message: "Successfully registered",
          data: doc,
          isSucces: true,
          token: token,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, isSucces: false });
  }
};

//add profile


//add username 
export const Addusername = async(req,res)=>{
  const{id} = req.params;
  const {userName}= req.body;
let profileImage =" "



  try{

    if (req.files.images) {
      const profile = req.files.images[0];
      const fileName = `${Date.now()}_${profile.originalname}`;
      const folder = 'images';

      // Set S3 path
      profileImage = `https://awcdn.s3-accelerate.amazonaws.com/${folder}/${fileName}`;
   
      // Background upload
      uploadFileToS3(profile.path, fileName, folder).catch((err) =>
        console.error('Image upload failed:', err)
      );
    }
      let findusername = await User.findOne({userName:userName});
      if(findusername){
        return res.status(200).json({message:"UserName is Already Exists Please Choose Another UserName",isSuccess:false})
      }
     
    let finduser = await User.findByIdAndUpdate({_id:id},{userName:userName,profileimage:profileImage},{new:true});
    return res.status(200).json({message:"Successfully Created Username ",isSuccess:true,data:finduser});

  }catch(error){
    return res.status(404).json({message:error.message,isSuccess:false})
  }
}

export const  userprofile = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
   
    // Check if the user exists
    let findout = await User.findOne({ _id: id });
     //comment(findout);

    let finduid = findout.uid;

    if (findout) {
      // Find all profiles associated with the user to count the roles
      let totalRoles = await userProfile.countDocuments({ userId: id });

      // Check if a profile with the same userId and role already exists
      let existingProfile = await userProfile.findOne({ userId: id, role: role });

      if (existingProfile) {
        // If the profile exists, return an error message
        res.status(409).json({
          message: "Role already created. Please wait for admin approval",
          totalRoles: totalRoles,
        });
      } else {
        // If the profile does not exist, create a new profile
        let newUserProfile = new userProfile({
          userId: id,
          role: role,
          uid: finduid,
        });
      
        if (role === "avatar") {
          // const transport = nodemailer.createTransport({
          //   host: "smtp.gmail.com", // Correct SMTP server
          //   port: 587,
          //   secure: false,
          //   requireTLS: true,
          //   auth: {
          //     user: "sanjubora84@gmail.com",
          //     pass: "gajchnswpbdvstiu",
          //   },
          // });

          // const mailOptions = {
          //   from: findout.email,
          //   to: `${process.env.FromMail}||"info@avatarwalk.com"`,
          //   subject: "New Avatar Signup Request",
           
          //   html:createAvatarRequestEmail(findout)
          
          // };

          // transport.sendMail(mailOptions, function (error, info) {
          //   if (error) {
          //     //comment(error);
          //   } else {
          //     //comment("Mail sent successfully: ", info.response);
          //   }
          // });
         // sendEmail(process.env.EMAIL_USER,"A New Avatar Request ",createAvatarRequestEmail(findout) );
        }
     if(role==="user"){

      newUserProfile.usercommission=15;
     }
     else if(role==="avatar"){
      findout.isAvatarApproved=true;
      newUserProfile.avatarcommission=25;
      await findout.save();
     }

        let doc = await newUserProfile.save();
        totalRoles += 1; 
        let userAdd = (await Address.findOne({ userId: id })) || {};
        const { country = "", city = "", profileimage = "", firstName = "", lastName = "", mobileNumber = "", dob = "" } = userAdd;

        findout.__v = undefined;
        findout.profileimage = undefined;
        findout.Viewpassword=undefined;
       findout.reportAvatar=undefined;
       findout.action=undefined;
       findout.status=undefined;
       findout.block=undefined;
       findout.Freeze=undefined;
       findout.action=undefined;
       findout.lastActive=undefined;
       findout.Online=undefined;
       findout.password=undefined;
       findout.confirmPassword=undefined;
        const token = jwt.sign({ data: findout, role: role }, process.env.KEY);
        res.status(201).json({
          message: role === "avatar" ? "" : "Role successfully created",
          data: doc,
          _id:doc.userId,
          isSuccess: true,
          totalRoles: totalRoles,
          userName: findout.userName,
          email: findout.email,
          terms: findout.terms,
          status: findout.status,
          Activeprofile: role,
          role:role,
          batch: findout.batch,
          isgoogleSignup:findout.isgoogleSignup,
          isAppleSignup:findout.isAppleSignup,
          isbooked: findout.isbooked,
          isAvatarApproved:findout.isAvatarApproved,
          Country: country,
          City: city,
          profileimage:findout.profileimage,
          firstName,
          lastName,
          mobileNumber,
          dob,
          token,
        });
      }
    } else {
      return res.status(500).json({ message: "No user found" });
    }
  } catch (error) {
    //comment(error);
    res.status(500).json({ message: "Something went wrong", isSuccess: false });
  }
};

export const deviceadd = async (req, res) => {
  const { id, device, role,glimble } = req.body;

  try {
    if (role === "avatar") {
      // Delete all existing devices with the same avatarId
      await MobileDevices.deleteMany({ avatarId: id });

      // Add the new device
      let newdevice = new MobileDevices({
        avatarId: id,
        device: device,
        glimble:glimble
      });

      let doc = await newdevice.save();

      return res.status(200).json({ message: "Added", isSuccess: true });
    } else {
      return res.status(200).json({ message: "Not allowed", isSuccess: false });
    }
  } catch (err) {
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};



// multiple address

export const MultipleAdd = async(req,res)=>{
  const{_id} = req.user;
  const{Country,State,City,Zipcode,town,lat,long} = req.body;
  try{
    // find the user id to the database
    let find = await User.findOne({_id:_id});
    if(find){
       let newAdd = new multipleAdd({
        userId:_id,
        Country:Country,
        State:State,
        City:City,
        Zipcode:Zipcode,
        town:town,

        lat:lat || " ",
        long:long || " "

       })
       let doc = await newAdd.save();
       //comment(doc);
       return res.status(200).json({message:"Successfully Added",data:doc,isSuccess:true})
    }
    else{
      return res.status(404).json({message:"Error",isSuccess:false});
    }

  }catch(err){
    return res.status(404).json({message:err.message,isSucces:false})
  }

}


//edit the multipladd

export const editmultipleAdd = async(req,res)=>{
  const{uid} = req.params;
 const{_id} = req.user;
 
  try{

    let findid = await User.findOne({_id:_id});
   //comment(findid,'jhsdjf');

   if(findid){
 
       let update = await multipleAdd.findByIdAndUpdate({_id:uid},req.body,{new:true});
       //comment(update);
      return res.status(200).json({message:"successfully updated",isSucces:true,data:update});
   }
   else{
    return res.status(404).json({message:"Error",isSuccess:false})
   }

  }catch(err){
    return res.status(404).json({message:err.message,isSuccess:false})
  }
}


export const getmuladd = async(req,res)=>{
const{_id} = req.user;
  try{

    let finduser = await User.findOne({_id:_id});
    if(finduser){
      let  getadd = await multipleAdd.find({userId:_id});
      return res.status(200).json({message:"Succesfully fetched",isSucces:true,data:getadd})
    }else{
      return res.status(200).json({message:"Invalid",isSucces:false})
    }
    
      

  }catch(err){
    //comment(err);
    return res.status(404).json({message:err.message,isSucces:false})
  }
}

//login user

export const deletemuladd = async (req, res) => {
  // Get the user ID from the request (assuming it's in req.user)
  const { _id } = req.user;
  // Get the unique address ID from params
  const { uid } = req.params;

  try {
    // Find the user by ID
    let findUser = await User.findOne({ _id: _id });
    
    // If the user exists
    if (findUser) {
      // Delete the address by the unique address ID (uid)
      let deleteAddress = await MultipleAdd.findOneAndDelete({ _id: uid, userId: _id });

      if (deleteAddress) {
        return res.status(200).json({ message: "Address deleted successfully", isSuccess: true });
      } else {
        return res.status(404).json({ message: "Address not found", isSuccess: false });
      }
    } else {
      return res.status(404).json({ message: "User not found", isSuccess: false });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};


export const loginuser = async (req, res) => {
  const { userName, password, role, uid } = req.body;

  try {
    // Find user by userName or uid and email
    let user;
    if (uid) {
      user = await User.findOne({ uid });
    } else {
      user = await User.findOne({
        $or: [
          { userName },
          { email: userName }  // Checking if the entered userName is actually an email
        ]
      });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials", isSuccess: false });
    }

    // Check if user can log in based on their status
    if (user.status !== 0 || user.block!==0 || user.Freeze!==0) {
      return res.status(403).json({ message: "User cannot login", isSuccess: false });
    }

  

    // Validate password if uid is not used
    if (!uid) {
      const isPasswordCorrect = bcrypt.compareSync(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(404).json({ message: "Password mismatch", isSuccess: false });
      }
    }

    // Fetch user profiles
    let profiles = await userProfile.find({ userId: user._id });
    let totalprofile = profiles.length;

    // Check if user already has an Activeprofile (remembered from signup)
    if (user.Activeprofile) {
      // Role is already set, no need to ask for role again
      if (user.Activeprofile === "avatar" && !user.isAvatarApproved) {
        return res.status(403).json({
          // message: "Request is still pending to become an avatar",
          isSuccess: false,
        });
      }

    
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
      const { country = "", city = "", State="",profileimage = "", firstName = "", lastName = "", mobileNumber = "", dob = "" } = userAdd;

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
          profileimage,
          firstName,
          lastName,
          mobileNumber,
          dob,
          totalprofile: totalprofile,
        },
        token,
        isSuccess: true,
      });
    }

    // If multiple profiles exist and no Activeprofile is set, ask for role selection
    if (profiles.length > 1) {
      user.action = "login";
 
      await user.save();

      if (!role) {
        return res.status(200).json({
          message: "Multiple profiles exist",
          action: "login",
          data: profiles,
          isSuccess: true,
        });
      }

      let validProfile = await userProfile.findOne({
        userId: user._id,
        role,
      });

      if (!validProfile) {
        return res.status(404).json({ message: "Invalid role selected", isSuccess: false });
      }

      // Save the selected role even if it is not approved
      user.Activeprofile = role;

      await user.save();

      if (role === "avatar" && !user.isAvatarApproved) {
        return res.status(403).json({
          // message: "Request is still pending to become an avatar",
          isSuccess: false,
        });
      }

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
        message: `Login successful as ${role}`,
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
          profileimage,
          firstName,
          lastName,
          mobileNumber,
          dob,
        },
        token,
        isSuccess: true,
      });
    }

    // Handle single profile scenario
    if (profiles.length === 1) {
      let userProfile = profiles[0];
    
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
      let Accessnoti = new Notification({
        userId:user._id

      })
      await Accessnoti.save();
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
          Online: user.Online,
          isbooked: user.isbooked,
          Country: country,
          City: city,
          State:State,
          profileimage,
          firstName,
          lastName,
          mobileNumber,
          dob,
        },
        isSuccess: true,
      });
    }

    return res.status(404).json({ message: "User profiles not found", isSuccess: false });
  } catch (error) {
    console.error("Error during login:", error); // Log error details for debugging
    res.status(500).json({ message: error.message });
  }
};


//check the email
const generateOtp = async () => {
  return Math.floor(1000 + Math.random() * 9000);
};

//done

export const checkemail = async (req, res) => {
  const { email } = req.body;
  try {
    let findemail = await User.findOne({ email: email });
    if (!findemail) {
      return res.status(404).json({
        success: false,
        message: "Email is not found",
        isSuccess: false,
      });
    }

    if (findemail) {
      let data = findemail._id;
      const g_otp = await generateOtp();
      let newOtp = new Otp({
        userId: findemail._id,
        otp: g_otp,
      });
      const doc = await newOtp.save();
      // const transport = nodemailer.createTransport({
      //   host: "smtp.gmail.com", // Correct SMTP server
      //   port: 587,
      //   secure: false,
      //   requireTLS: true,
      //   auth: {
      //     user: `sanjubora84@gmail.com`,
      //     pass: `gajchnswpbdvstiu`,
      //   },
      // });

      // const mailOptions = {
      //   from: `info@avatarwalk.com`,
      //   to: email,
      //   subject: "Your Verification Otp",
      //   html: createEmailHtml(g_otp),
      // };
      
      // transport.sendMail(mailOptions, function (error, info) {
      //   if (error) {
      //     //comment(error);
      //   } else {
      //     //comment("Mail sent successfully: ", info.response);
      //   }
      // });
      sendEmail(email,"Your Verification Otp",createEmailHtml(g_otp))

      return res.status(200).json({
        success: true,
        message: "Successfully send the Otp to verified email",
        id: data,
        isSuccess: true,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};

export const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  const { id } = req.params; // Expecting userId to verify the OTP for a specific user

  try {
    // Find the OTP record that matches the provided OTP and userId
    let checkotp = await Otp.findOne({ otp: otp, userId: id });

    if (checkotp) {
      // Check if the OTP is expired
      if (new Date() - checkotp.createdAt > 60000) {
        // OTP is older than 60 seconds
        return res.status(400).json({ message: "OTP has expired", isSuccess: false });
      }

      //comment("Matched successfully");
      return res.status(200).json({ message: "Ok", isSuccess: true, id: checkotp.userId });
    } else {
      //comment("Invalid OTP or User ID");
      return res.status(404).json({ message: "Invalid OTP ", isSuccess: false });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong", isSuccess: false });
  }
};

//changed password
export const changepassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword, confirmPassword } = req.body;
  try {
    let findid = await User.findOne({ _id: id });
    if (!findid) {
      return res.status(404).json({ message: "Id not found" });
    }

    let oldpass = bcrypt.compareSync(newPassword, findid.password);
    if (oldpass) {
      return res.status(404).json({
        message: "password should be different from the old one",
        isSuccess: false,
      });
    }

    let newpasshash = bcrypt.hashSync(newPassword, salt);
    let confirmhash = bcrypt.hashSync(confirmPassword, salt);

    if (newPassword === confirmPassword) {
      let updatepassword = await User.findByIdAndUpdate({ _id: id }, { password: newpasshash, confirmPassword: confirmhash }, { new: true });

      return res.status(200).json({ message: "Password Update succesfully", isSuccess: true });
    } else {
      return res.status(500).json({ message: "Password didn't match", isSuccess: false });
    }
  } catch (error) {
    return res.status(500).json({ message: "Something error", isSuccess: false });
  }
};

//get the user

export const getuser = async (req, res) => {
  try {
    const { search } = req.query;

    const { _id } = req.user;
    const role = req.role;

    let userdetail = await User.findOne({ _id: _id }, { __v: 0, status: 0 });

    let profiledetail = await Profile.findOne({ userId: _id }, { _id: 0, userId: 0, __v: 0 });

    let address;

    if (search) {
      address = await Address.find({
        userId: _id,

        $or: [{ street: { $regex: search, $options: "i" } }, { city: { $regex: search, $options: "i" } }, { country: { $regex: search, $options: "i" } }, { state: { $regex: search, $options: "i" } }],
      });
    } else {
      address = await Address.find({ userId: _id });
    }

    let response = {
      data: userdetail,
      profiledetail: profiledetail,
      role: role,
      address: address,
      isSuccess: true,
    };

    let experience = await Experience.find({ avatarId: _id, status: 0 }, { __v: 0 });

    if (role === "avatar") {
      response.experience = experience;
    }

    return res.status(200).json(response);
  } catch (error) {
    //comment(error);
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};

//api for delete  the user account
export const deleteAcc = async (req, res) => {
  try {
    const { _id } = req.user;
    const { s } = req.params;

    let check = await User.findOne({ _id: _id });
    if (!check) {
      return res.status(404).json({ message: "sorry user not found", isSuccess: false });
    } else {
      let updatestaus = await User.findOneAndUpdate(
        { _id: _id },
        { status: s },
        {
          new: true,
        }
      );

      return res.status(201).json({ message: updatestaus, isSuccess: true });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};

export const freezeAcc = async (req, res) => {
  try {
    const { _id } = req.user;
    const { s } = req.params;

    let check = await User.findOne({ _id: _id });
    if (!check) {
      return res.status(404).json({ message: "sorry user not found", isSuccess: false });
    } else {
      let updatestaus = await User.findOneAndUpdate(
        { _id: _id },
        { Freeze: s },
        {
          new: true,
        }
      );

      return res.status(201).json({ message: updatestaus, isSuccess: true });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};

//recover thee freeze account
export const recoverFreezeAccount = async (req, res) => {
  try {
    const { _id } = req.user;
    let findid = await User.findOne({ _id: _id });
    if (!findid) {
      return res.status(404).json({ message: "sorry id is not found", isSuccess: false });
    }
    if (findid) {
      if (findid.Freeze == 1) {
        findid.Freeze = 0;
        await findid.save();
        return res.status(201).json({ message: findid, isSuccess: true });
      } else {
        return res.staus(500).json({ message: "sorry your id is not frozzen", isSuccess: false });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, isSuccess: false });
  }
};






// add the address
export const AddProfile = async (req, res) => {
  const { country, city, State, zipCode,lat,lng,code } = req.body;

  try {
    const { id } = req.params;
    let profile = await User.findOne({ _id: id });
    let finduser = await Address.findOne({ userId: id });

    if (finduser) {
      // return res.status(404).json({ message: "Only edit" });
    } else {
      let newAddress = new Address({
        userId: id,
        country: country,
        city: city,
        State: State,
        zipCode: zipCode,
        lat:lat,
        lng:lng,
        code:code
      });
      let doc = await newAddress.save();
      doc.profileimage = profile.profileimage;
      await doc.save();

      return res.status(201).json({ message: "successfully created", data: doc, isSuccess: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message, isSuccess: false });
  }
};

export const editprofile = async (req, res) => {
  const { firstName, lastName, mobileNumber, dob, country, city,Bio,lat,lng,userName ,state} = req.body;
const{_id}=req.user;

  // Check if the file is provided
 

let profileImage="";
  try {
    const { id } = req.params;
    if (req.files.file) {
      const profile = req.files.file[0];
      const fileName = `${Date.now()}_${profile.originalname}`;
      const folder = 'images';

      // Set S3 path
    profileImage = `https://awcdn.s3-accelerate.amazonaws.com/${folder}/${fileName}`;
 
      // Background upload
      uploadFileToS3(profile.path, fileName, folder).catch((err) =>
        console.error('Image upload failed:', err)
      );
    }

    // Find user by id
    let user = await User.findOne({ _id: id });
    let findtotalprofile = await userProfile.find({ userId: id });
    const totalprofile = findtotalprofile.length;
    // Check if the address exists
    let checkid = await Address.findOne({ userId: id });
    if (!checkid) {
      return res.status(404).json({ message: "Address ID not found", isSuccess: false });
    }

    // Prepare the update data
    let updateData = {
      firstName: firstName,
      lastName: lastName,
      mobileNumber: mobileNumber,
      dob: dob,
      country: country,
      city: city,
      State:state,
      about:Bio,
      lat:lat,
      lng:lng,
      profileimage:profileImage
    
    };

    // If file is provided, add profileimage to update data


    



    // Update the address
    let updateaddress = await Address.findOneAndUpdate({ userId: id }, updateData, { new: true });

   
    let updateusername = await User.findOneAndUpdate({_id:_id},{userName:userName },{new:true});


    return res.status(200).json({
      message: "Profile updated successfully",
      data: {
        _id: id,
        email: user.email,
        userName: user.userName,
        firstName: updateaddress.firstName,
        lastName: updateaddress.lastName,
        mobileNumber: updateaddress.mobileNumber,
        dob: updateaddress.dob,
        profileimage: updateaddress.profileimage,
        Country: updateaddress.country,
        City: updateaddress.city,
        State: updateaddress.State,
        Activeprofile: user.Activeprofile,
        totalprofile: totalprofile,
        about:Bio
      },
      isSuccess: true,
    });
  } catch (error) {
    //comment(error);
    res.status(500).json({ message: error.message, isSuccess: false });
  }
};

export const deleteaddress = async (req, res) => {
  try {
    const { id } = req.params;

    let findid = await Address.findOne({ _id: id });

    if (!findid) {
      return res.status(500).json({ message: "id is not found", isSuccess: false });
    } else {
      let deleteaddress = await Address.findByIdAndUpdate({ _id: id }, req.body, { new: true });

      return res.status(200).json({ message: "successfully deleted", isSuccess: true });
    }
  } catch (error) {}
};



// get the offer that user send to the avatar .
export const allOffers = async (req, res) => {
  // query comes from frontend
  const { query } = req.query;
  const { _id } = req.user;
  const role = req.role;

  try {
    let getallOffers;
    if (role === "avatar") {
      if (query) {
        getallOffers = await Offer.find({ avatarId: _id, status: query });
      } else {
        getallOffers = await Offer.find({ avatarId: _id, status: "Pending" });
      }

      return res.status(200).json({ message: "All Offers", data: getallOffers, isSuccess: true });
    } else {
      //comment("only avatar can get the offers");
      return res.status(500).json({ message: "only avatar can get the offers", isSuccess: false });
    }
  } catch (error) {
    return res.status(500).json({ message: "Something error ", isSuccess: false });
  }
};

export const switchProfile = async (req, res) => {
  const { _id } = req.user;
  const { newrole } = req.body;

  try {
    // Find user, address, and profiles by user ID
    const user = await User.findOne({ _id });
    const userAdd = await Address.findOne({ userId: _id });
    const profiles = await userProfile.find({ userId: _id });

    if (!user) {
      return res.status(404).json({
        message: "User not found. Please login or create an account.",
        isSuccess: false,
      });
    }

    //comment("Profiles found:", profiles);

    if (profiles.length === 0) {
      return res.status(404).json({ message: "User profiles not found", totalprofile: 0, isSuccess: false });
    }

    // Handle if user tries to switch to avatar but is not approved
    if (newrole === "avatar" && !user.isAvatarApproved) {
      return res.status(403).json({
        message: "Please wait for approval to switch to avatar role",
        isSuccess: false,
      });
    }

    // Check if only one profile exists and the new role is valid
    if (profiles.length === 1) {
      if ((profiles[0].role === "avatar" && newrole === "user") || (profiles[0].role === "user" && newrole === "avatar")) {
        const newProfile = new userProfile({
          userId: _id,
          role: newrole,
        });
        const newp = await newProfile.save();
        user.Activeprofile = newp.role;
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
        // Generate a new token with the updated role
        const token = jwt.sign({ data: user, role: user.Activeprofile }, process.env.KEY);

        return res.status(201).json({
          message: "New role successfully created",
          data: {
            _id: newp.userId,
            userName: user.userName,
            email: user.email,
            terms: user.terms,
            status: user.status,
            role: newp.role,
            Activeprofile: newp.role,
            batch: user.batch,
            isbooked: user.isbooked,
            Country: userAdd ? userAdd.country : "N/A", // Allow access even if address not found
            City: userAdd ? userAdd.city : "N/A",
            profileimage: userAdd ? userAdd.profileimage : "N/A",
            firstName: userAdd ? userAdd.firstName : "N/A",
            lastName: userAdd ? userAdd.lastName : "N/A",
            mobileNumber: userAdd ? userAdd.mobileNumber : "N/A",
            dob: userAdd ? userAdd.dob : "N/A",
            State: userAdd ? userAdd.State : "N/A",
            totalprofile: 2,
          },
          token, // Send the new token to the client
          isSuccess: true,
        });
      } else {
        return res.status(400).json({
          message: "Invalid role switch requested",
          totalprofile: 1,
          isSuccess: false,
        });
      }
    }

    // Handle if the user has two profiles and can switch between them
    if (profiles.length === 2) {
      const newActiveRole = user.Activeprofile === "user" ? "avatar" : "user";
      //comment("Switching role to:", newActiveRole);

      if (newActiveRole === "avatar" && !user.isAvatarApproved) {
        return res.status(403).json({
          message: "Please wait for approval to switch to avatar role",
          isSuccess: false,
        });
      }

      user.Activeprofile = newActiveRole;
      await user.save();
      //comment("User updated:", user);
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
      // Generate a new token with the updated role
      const token = jwt.sign({ data: user, role: user.Activeprofile }, process.env.KEY);

      return res.status(200).json({
        message: `Profile switched to ${newActiveRole}`,
        data: {
          _id: user._id,
          userName: user.userName,
          email: user.email,
          terms: user.terms,
          status: user.status,
          role: user.Activeprofile,
          Activeprofile: user.Activeprofile,
          batch: user.batch,
          isbooked: user.isbooked,
          Country: userAdd ? userAdd.country : "N/A", // Allow access even if address not found
          City: userAdd ? userAdd.city : "N/A",
          profileimage: userAdd ? userAdd.profileimage : "N/A",
          firstName: userAdd ? userAdd.firstName : "N/A",
          lastName: userAdd ? userAdd.lastName : "N/A",
          mobileNumber: userAdd ? userAdd.mobileNumber : "N/A",
          dob: userAdd ? userAdd.dob : "N/A",
          State: userAdd ? userAdd.State : "N/A",
          totalprofile: 2,
        },
        token, // Send the new token to the client
        isSuccess: true,
      });
    }
  } catch (error) {
    console.error("Error switching profile:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message, isSuccess: false });
  }
};


//create a offer to the repspective avatar

export const createoffer = async (req, res) => {
  const { _id } = req.user; // Fetch the login id
  const role = req.role;

  try {
    const getcommision = await userProfile.findOne({userId:_id,role:"user"});
    const adminfee = getcommision.usercommission;
    const { Title, price, Minutes, Country, City, ZipCode, Notes, State, lat, lng, Date: offerDate, Time } = req.body;

    // Ensure proper parsing of offerDate and Time into ISO format
    const dateOnly = new Date(offerDate); // Using 'offerDate' instead of 'Date' to avoid conflict
    const timeOnly = Time.split(":"); // Expecting time in format "HH:MM"
    if (timeOnly.length !== 2) {
      return res.status(400).json({ message: "Invalid time format. Expected HH:MM.", isSuccess: false });
    }

    // Combine the date and time into a full ISO timestamp
    const startDateTime = new Date(dateOnly.setUTCHours(parseInt(timeOnly[0]), parseInt(timeOnly[1]), 0));
    const endDateTime = new Date(startDateTime.getTime() + Minutes * 60000);

    // Only user can create the offer for a specific avatar

    if (role === "user") {
      let Name = await User.findOne({ _id: _id });
      //comment(Name);

      let newOffer = new Offer({
        userId: _id,
        userName: Name.userName,
        Title: Title,
        Price: price,
        Minutes: Minutes,
        Country: Country,
        City: City,
        State: State,
        ZipCode: ZipCode,
        Notes: Notes,
        lat: lat,
        lng: lng,
        location: {
          type: "Point",
          coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
        },
        Date: offerDate, // Storing raw date
        Time: startDateTime,
        endTime:endDateTime,
        adminFee:adminfee
         // Storing full date with time
      });

      let doc = await newOffer.save();

      return res.status(201).json({
        message: "Offer created successfully",
        data: doc,
        isSuccess: true,
      });
    } else {
      //comment("Avatar cannot create the offer");
      return res.status(403).json({
        message: "Avatar cannot create the offer",
        isSuccess: false,
      });
    }
  } catch (error) {
    //comment(error);
    return res.status(500).json({ message: error.message });
  }
};



export const getAllcountry = async (req, res) => {
  try {
    const experiences = await Experience.find({});

    const countries = experiences.map((exp) => exp.country).filter((value, index, self) => self.indexOf(value) === index);

    return res.status(200).json({ data: countries, isSuccess: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// report for correspondig avatar
export const Reportexp = async (req, res) => {
  const { _id } = req.user; // The ID of the user making the report
  const { id } = req.params; // The ID of the experience being reported
  const role = req.role; // The role of the user making the request
  const { SexualContent, VoilentContent, AbusiveContent, DangerousContent, SpamContent } = req.body; // The report details

  try {
    let findId = await User.findOne({ _id: _id }); // Find the user making the report
    let findexp = await Experience.findOne({ _id: id }); // Find the experience being reported

    if (role === "user") {
      if (findId) {
        // Check if the user has already reported this experience
        const existingReport = await Report.findOne({ packageId: id, userId: _id });

        if (existingReport) {
          return res.status(400).json({ message: "You have already reported this experience.", isSuccess: false });
        }

        // Create a new report if no existing report is found
        let newReport = new Report({
          SexualContent,
          VoilentContent,
          AbusiveContent,
          DangerousContent,
          SpamContent,
          avatarId: findexp.avatarId,
          userId: _id,
          packageId: id,
        });

        let doc = await newReport.save();
        findexp.reportExp.push(doc._id);
        await findexp.save();

        return res.status(200).json({ message: "Successfully submitted", data: doc, isSuccess: true });
      } else {
        //comment("User ID is not found");
        return res.status(404).json({ message: "User ID is not found", isSuccess: false });
      }
    } else {
      return res.status(403).json({ message: "You don't have permission to report", isSuccess: false });
    }
  } catch (err) {
    //comment(err);
    return res.status(500).json({ message: err.message });
  }
};

export const getAvatar = async (req, res) => {
  try {
    // Fetch avatars with populated userId
    let findavatar = await userProfile.find({ role: "avatar" });

    // Map through the findavatar array to collect all user details
    const transformedData = await Promise.all(
      findavatar.map(async (avatar) => {
        // Fetch the user details from the User model using userId
        let user = await User.findById(avatar.userId);
        let userImage = await Address.findOne({ userId: avatar.userId });

        return {
          id: avatar.userId,
          name: user ? user.userName : null, // Include the user name if available
          profile: userImage ? userImage.profileimage : null, // Include the profile image if available
        };
      })
    );

    return res.status(200).json({ message: "avatar fetched", data: transformedData, isSuccess: true });
  } catch (err) {
    //comment(err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

export const getChat = async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;

  try {
    // Find chat where the sender is _id and receiver is id or vice versa
    let findChat = await Chat.find({
      $or: [
        { sender: _id, receiver: id },
        { sender: id, receiver: _id },
      ],
    });

    if (findChat.length > 0) {
      // Separate the sent and received messages
      const receivedMessages = findChat.filter((chat) => chat.sender.toString() === _id.toString());
      const sentMessages = findChat.filter((chat) => chat.receiver.toString() === _id.toString());

      return res.status(200).json({
        message: "Successfully fetched",
        data: {
          sentMessages,
          receivedMessages,
        },

        isSuccess: true,
      });
    } else {
      return res.status(404).json({
        message: "No chat found",
        isSuccess: false,
      });
    }
  } catch (err) {
    //comment(err);
    return res.status(500).json({
      message: err.message,
    });
  }
};

export const paymentdone = async (req, res) => {
  // this will  be the user id
  const { _id } = req.user;
  const { bid } = req.params;
  try {
    let checkbid = await Booking.findOne({ _id: bid });
    let aid = checkbid.avatarId;
    if (checkbid) {
      let newpayment = new Payment({
        userId: _id,
        avatarId: aid,
        bookingId: bid,
      });
      let doc = await newpayment.save();
      return res.status(200).json({ message: "successfully added ", data: doc, isSucces: true });
    } else {
      //comment("booking id is not found");
      return res.status(404).json({ message: "not found", isSuccess: false });
    }
  } catch (err) {
    //comment(err);
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};

export const getAlluser = async (req, res) => {
  try {
    // Fetch avatars with populated userId
    let findavatar = await userProfile.find({ role: "user" });

    // Map through the findavatar array to collect all user details
    const transformedData = await Promise.all(
      findavatar.map(async (avatar) => {
        // Fetch the user details from the User model using userId
        let user = await User.findById(avatar.userId);
        let userImage = await Address.findOne({ userId: avatar.userId });

        return {
          id: avatar.userId,
          name: user ? user.userName : null, // Include the user name if available
          profile: userImage ? userImage.profileimage : null, // Include the profile image if available
        };
      })
    );

    return res.status(200).json({ message: "avatar fetched", data: transformedData, isSuccess: true });
  } catch (err) {
    //comment(err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

export const avatarReport = async (req, res) => {
  const { _id } = req.user; // The ID of the user making the report
  const { aid } = req.params; // The ID of the avatar being reported
  const role = req.role; // The role of the user making the request
  const { Scamming, Offensive, SomethingElse } = req.body; // The report details

  try {
    let findaid = await User.findOne({ _id: aid });

    if (role === "user") {
      if (findaid) {
        // Check if the user has already reported this avatar
        const existingReport = await ReportAvt.findOne({ avatarID: aid, userId: _id });

        if (existingReport) {
          return res.status(400).json({ message: "You have already reported this avatar.", isSuccess: false });
        }

        // Create a new report if no existing report is found
        let AvatarReport = new ReportAvt({
          avatarID: aid,
          userId: _id,
          Scamming,
          Offensive,
          SomethingElse,
        });

        const doc = await AvatarReport.save();

        // Add the report ID to the avatar's reportAvatar array
        findaid.reportAvatar.push(doc._id);
        await findaid.save();

        // Check if the length of reportAvatar array is 3
        if (findaid.reportAvatar.length === 3) {
          // Update statusBlock to 1 if the avatar has 3 reports
          findaid.block = 1;
          await findaid.save();
        }

        return res.status(200).json({ message: "Successfully reported", isSuccess: true });
      } else {
        return res.status(404).json({ message: "Avatar not found", isSuccess: false });
      }
    } else {
      return res.status(403).json({ message: "You don't have permission to report", isSuccess: false });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};


export const getrole = async(req,res)=>{
  const{_id} = req.user;
  try{
   let find = await userProfile.countDocuments({userId:_id});
   return res.status(200).json({message:"successfully fetched",roles:find,isSuccess:true})

  }catch(err){
    //comment(err);
    return res.status(404).json({message:err.message,isSuccess:false})
  }
}


export const chatwithavatar = async (req, res) => {
  const { _id } = req.user;
  const role = req.role;

  try {
    if (role === "user") {
      // Fetch bookings where the avatar is involved
      const bookings = await Booking.find({ userId: _id, status: { $in: ['Booked', 'Completed'] } })
                                   .populate('avatarId', 'userName');
      
      // Use a Set to collect unique user IDs
      const userIdSet = new Set();
      bookings.forEach(booking => userIdSet.add(booking.avatarId));

      // Fetch unique users from the set of user IDs
      const uniqueUsers = await User.find({ _id: { $in: Array.from(userIdSet) } });
      
      // Fetch profile images
      const profiles = await Address.find({ userId: { $in: Array.from(userIdSet) } });

      // Create a mapping of userId to profile image URL
      const profileMap = profiles.reduce((acc, profile) => {
        acc[profile.userId.toString()] = profile.profileimage;
        return acc;
      }, {});

      // Map user details including profile image URL
      const data = uniqueUsers.map(user => ({
        id: user._id,
        name: user.userName,
        profile: profileMap[user._id.toString()] || null // Get the profile image URL
      }));
      if(data.length===0){
        return res.status(200).json({message:"No data found"});
      }
      return res.status(200).json({ data, isSuccess: true });
    
    } else {
      return res.status(400).json({ message: "Invalid role", isSuccess: false });
    }
  } catch (err) {
    //comment(err);
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};

export const completeoffer = async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;

  try {
    // Find the user
    let finduser = await User.findOne({ _id });
    if (!finduser) {
      return res.status(404).json({ message: "User not found", isSuccess: false });
    }

    // Find the offer
    let findoffer = await Offer.findOne({ _id: id });
    if (!findoffer) {
      return res.status(404).json({ message: "Offer not found", isSuccess: false });
    }

    // Update the offer status to "Completed"
    findoffer.status = "Completed";
    await findoffer.save();

    // Ensure the price is treated as a number
    const offerPrice = parseFloat(findoffer.Price);

    // Find the account related to the avatar (to track earnings)
    let totalprice = await Account.findOne({ to: findoffer.avatarId });

    if (totalprice) {
      // If the account exists, push the offer price and update total earnings
      totalprice.OfferPrice.push(offerPrice);
      totalprice.totalEarning = parseFloat(totalprice.totalEarning) + offerPrice;
      await totalprice.save();
    } else {
      // If the account does not exist, create a new one
      let newAccount = new Account({
        from: _id,
        to: findoffer.avatarId,
        OfferPrice: [offerPrice],
        totalEarning: offerPrice, // Initialize totalEarning with the current offer price
      });
      await newAccount.save();
    }

    // Return success response
    return res.status(200).json({ message: "Offer completed and earnings updated", isSuccess: true });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

// report a bug
export const reportbug = async(req,res)=>{
  const{description}=req.body;
  const{_id} = req.user;

   try{ 

    let findemail = await User.findOne({_id:_id});
    let useremail = findemail.email;
    const date = new Date();

     
     sendEmail(process.env.EMAIL_USER,'A New Bug is Submitted',createBugReportEmailHtml(description, useremail, date));
  return res.status(200).json({message:"Bug submit Successfully",isSuccess:true})


  }catch(err){
    console.log(err);
    return res.status(404).json({message:err.message,isSuccess:false})
  }
}
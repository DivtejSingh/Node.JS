import express from "express";
import { getExperiences, rating } from "../../Controllers/User/ExperienceController.js";
import {
  AddUser,
  loginuser,
  checkemail,
  changepassword,
  AddProfile,
  userprofile,
  getuser,
  editprofile,
  deleteAcc,
  recoverFreezeAccount,
  deleteaddress,
  createoffer,
  switchProfile,
  getAllcountry,
  verifyOtp,
  avatarReport,
  getAvatar,
  getChat,
  paymentdone,
  getAlluser,

  Reportexp,getrole,chatwithavatar,deviceadd,MultipleAdd,editmultipleAdd,getmuladd,completeoffer,Addusername,freezeAcc,
  reportbug
} from "../../Controllers/User/userController.js";
import { meetdata } from "../../Controllers/User/ExperienceController.js";
import { getTours,detailpublictour, getallmaps} from "../../Controllers/User/tourcontroller.js";
import { getBookingDetails, booking, getbookingslots, updateBookingTime, updateBookingDate } from "../../Controllers/User/BookingController.js";
import { getExperience, getFilteredExperience, getdetailExp, addlike, expStatus, giveRating, getAllExperience ,getdetailExphome} from "../../Controllers/User/ExperienceController.js";
import {payout,refundForuser ,avtartip,paypalavttip,publicJoin,publicJoinPaypal,payaddon,offercheckout,offerPaypalcheckout} from "../../Controllers/User/PaymentController.js";
import { sendMessage, editChat, deleteChat, replyChat } from "../../Controllers/User/ChatController.js";
import { verifyToken } from "../../Middleware/Auth.js";
import uploadMiddleware, {upload } from "../../Middleware/multer.js";
import { SignUpAndLoginWithGoogle } from "../../Controllers/User/GoogleSignInController.js";
import { Notifications ,getNotification} from "../../Controllers/User/NotificationControler.js";
import { allAvathons, bookavathons, getbookavathons,getavathonsdetails, avathoncheckout, avathonPaypalcheckout,giveavtRating, notificationtoall } from "../../Controllers/User/avathonController.js";
export const userRouter = express.Router();

userRouter
.get('/meetdata/:id',verifyToken,meetdata)
  .get("/get", verifyToken, getuser)
  .get("/getmuladd",verifyToken,getmuladd)
  .get("/expStatus", verifyToken, expStatus)
  .get("/tours",verifyToken,getTours)
  .get("/alltoursmap",verifyToken,getallmaps)
  .get("/tourdetail",verifyToken,detailpublictour)
  .get('/meetdata/:id',verifyToken,meetdata)
  .get("/getExperience",getExperience)
  .get("/getExperiences",verifyToken,getExperiences)

  .get("/getavathondetail/:id",getavathonsdetails)
  .get("/getallexperience", getAllExperience)
  .get("/getdetailExp/:id",verifyToken, getdetailExp)
  .get("/getdetailExps/:id",getdetailExphome)
  .get("/chatwithavatar",verifyToken,chatwithavatar)
  .get("/getNotification",verifyToken,getNotification)
  .get("/getExpcategorywise", getFilteredExperience)
  .get("/getAllcountry", getAllcountry)
  .get("/getBookingDetails/:bookingId", verifyToken, getBookingDetails)
  .get("/getavatar", getAvatar)
  .get("/getchat/:id", verifyToken, getChat)
  .get("/bookingslots/:pid", verifyToken, getbookingslots)
  .get("/getAlluser", verifyToken, getAlluser)
  .get("/getrole",verifyToken,getrole)
  .get("/getavathons",verifyToken,allAvathons)

  .post("/deviceadd",deviceadd)
  .post("/completeoffer/:id",verifyToken,completeoffer)
  .post("/userprofile/:id", userprofile)
  .post("/Adduser",uploadMiddleware, AddUser)
  .post("/checkemail", checkemail)
  .post("/verifyOtp/:id", verifyOtp)
  .post("/payout",verifyToken,payout)
  .post("/login", loginuser)
  .post("/tipsendpaypal",verifyToken,paypalavttip)
   .post("/addAddress",verifyToken,MultipleAdd)
   .post("/Notifications",verifyToken, Notifications)
  .post("/paymentPaypal",verifyToken,publicJoinPaypal)
  .post("/paymentstripe",verifyToken,publicJoin)
  .post("/reportbug",verifyToken,reportbug)
  // login in with google Signup and  SignIn
  .post("/googlesignupandsignin", SignUpAndLoginWithGoogle)
  .post("/offercheckout",verifyToken,offercheckout)
  .post("/offerPaypalcheckout",verifyToken,offerPaypalcheckout)

  .post("/addProfile/:id", AddProfile)
  .post("/recoverFreezeAccount", verifyToken, recoverFreezeAccount)

  .post("/report/:id", verifyToken, Reportexp)
  .post("/avatarReport/:aid", verifyToken, avatarReport)
  .post("/bookavathon/:id",verifyToken,bookavathons)
.get('/avathons',verifyToken,getbookavathons)
  .post("/createoffer", verifyToken, createoffer)
  .post("/payaddon",verifyToken,payaddon)
  .post("/switchProfile", verifyToken, switchProfile)
  .post("/booking/:pid", verifyToken, booking)
  .post("/giveRating/:id", verifyToken, giveRating)
  .get("/rating/:id",verifyToken, rating)
  .post("/addlike/:id", verifyToken, addlike)
   .post('/refunduser',verifyToken,refundForuser)
  // .post("/instantlive/:id", verifyToken, Instantlive)
  //chat
  .post("/chat/:id", verifyToken, sendMessage)
  .post("/reply/:id", verifyToken, replyChat)
  .post("/paymentdone/:bid", verifyToken, paymentdone)
  .post("/tipsendstripe",verifyToken,avtartip)

  .post('/avathoncheckout',verifyToken,avathoncheckout)
  .post('/avathonpaypal',verifyToken,avathonPaypalcheckout)
  .post('/giverate/:id',verifyToken,giveavtRating)
  .post('/notification',verifyToken,notificationtoall)

  .patch("/editAdd/:uid",verifyToken,editmultipleAdd)
  .delete("/deletemuladd/:uid",verifyToken, )
  .patch("/editchat/:id", verifyToken, editChat)
  .patch("/deletechat/:id/:status", verifyToken, deleteChat)
  .patch("/username/:id",uploadMiddleware,Addusername)

  .patch("/deleteaddress/:id", verifyToken, deleteaddress)
  .patch("/updateBookingTime/:bookingId", verifyToken, updateBookingTime)
  .patch("/updateBookingDate/:bookingId", verifyToken, updateBookingDate)
  .patch("/deleteAcc/:s", verifyToken, deleteAcc)
  .patch("/freezeAcc/:s",verifyToken,freezeAcc)
  .patch("/changepassword/:id", changepassword)
  .patch("/addprofile/:id", uploadMiddleware, verifyToken, editprofile);



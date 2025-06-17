import express from "express";
import { login, register, requestPasswordReset, resetPassword, verifyOtp, addcommison } from "../../Controllers/Admin/authController.js";
import { addUser, avtarReportQuery, experienceDeleteQuery, experienceReportQuery, GetallUsers, getuserId } from "../../Controllers/Admin/userController.js";
import { AdminVerify } from "../../Middleware/AdminVerify.js";
import { deleteAvatar, getAllAvatar, getAvatarById, searchAvatar,getAvatarlocation } from "../../Controllers/Admin/avatarController.js";
import { deleteExperience, getAllExperience, getExperienceById, searchExperiences, getcancelledbyuser, getcancelledbyavatar, getCompletedAvatarstours, deleteExperienceById ,getallreviews} from "../../Controllers/Admin/experienceController.js";
import { searchUsers ,Edituser,getcommission,updateCommission,avatarreport,expreport} from "../../Controllers/Admin/userController.js";
import { deleteUser } from "../../Controllers/Admin/userController.js";
import { getUserById } from "../../Controllers/Admin/userController.js";
import { getLocationsForMap } from "../../Controllers/Admin/getLocationController.js";
import { refunds } from "../../Controllers/User/PaymentController.js";
import { GetAllReport, ApproveReport, BlockReport, GetAllReportAvt } from "../../Controllers/Admin/reportController.js";
import { dashboardDataApi ,newAvatarsapi,dashboarddata,totalusercommision ,updatestatusreport } from "../../Controllers/Admin/DashboardController.js";
import { GetAllRequest, UpdateRequestStatus } from "../../Controllers/Admin/requestController.js";
import { verifyToken } from "../../Middleware/Auth.js";
import { searchCommissions } from "../../Controllers/Admin/commisionControlller.js";
import { addDevices, deleteDevices, GetAllDevices, GetAllWithoutDevices, updateDevices } from "../../Controllers/Admin/devicesController.js";
import {upload } from "../../Middleware/multer.js";
import { getalltours, tourdetails } from "../../Controllers/Admin/tourController.js";
import { Admin } from "../../Models/Admin/AdminModel.js";
import { getTours } from "../../Controllers/Admin/DashboardController.js";
import { acceptAvathons, getAllAvathons, getAvathonbyid } from "../../Controllers/Admin/avathonsController.js";
export const adminRouter = express.Router();

// dashboard api
adminRouter.get("/dashboard", AdminVerify, dashboardDataApi);
adminRouter.get("/dashAvatars",AdminVerify,newAvatarsapi);
adminRouter.get("/dashboarddata",AdminVerify,dashboarddata )
adminRouter.get("/usercommison",AdminVerify,totalusercommision );
// auth
adminRouter.get("/getlive",AdminVerify,getTours);
adminRouter.get("/avatarlocation",AdminVerify,getAvatarlocation );


adminRouter.post("/register", register);
adminRouter.post("/verify-otp", verifyOtp);
adminRouter.post("/login", login);
adminRouter.post("/request-password-reset", requestPasswordReset);
adminRouter.post("/reset-password", resetPassword);
// adminRouter.post("/transfertoavtar",AdminVerify,transferToAvatar)
// adminRouter.post("/transferOnCancellation",AdminVerify,transferOnCancellation)
// adminRouter.post("/refunds",AdminVerify,refunds)

// user
adminRouter.get("/dispute", AdminVerify, getcancelledbyuser);
// adminRouter.get("/refund",AdminVerify,getcancelledbyavatar);
adminRouter.get("/getCompletedAvatarstours", AdminVerify, getCompletedAvatarstours);
adminRouter.get("/alltours",AdminVerify,getalltours);
adminRouter.get("/tourdetails/:id",AdminVerify,tourdetails);
adminRouter.get("/getusers", AdminVerify, GetallUsers);
adminRouter.get("/user-search", AdminVerify, searchUsers);
adminRouter.patch("/user-delete/:id", AdminVerify, deleteUser);
adminRouter.get("/user/:id", AdminVerify, getUserById);

// avatar
adminRouter.get("/getallavatar", AdminVerify, getAllAvatar);
adminRouter.get("/avatar-search", AdminVerify, searchAvatar);
adminRouter.delete("/avatar-delete/:id", AdminVerify, deleteAvatar);
adminRouter.get("/avatar/:id", AdminVerify, getAvatarById);

// Experience
adminRouter.get("/getallexperience", AdminVerify, getAllExperience);
adminRouter.patch("/deleteexperience/:id", AdminVerify, deleteExperienceById);
adminRouter.get("/experience-search", AdminVerify, searchExperiences);
adminRouter.delete("/experience-delete/:id", AdminVerify, deleteExperience);
adminRouter.get("/experience/:id", AdminVerify, getExperienceById);
adminRouter.get("/getreview/:id",AdminVerify,getallreviews);

// request
adminRouter.get("/getallrequest", AdminVerify, GetAllRequest);
adminRouter.patch("/update-request-status", AdminVerify, UpdateRequestStatus);

// report
adminRouter.get("/getallreports", AdminVerify, GetAllReport);
adminRouter.get("/getallavatarreports", AdminVerify, GetAllReportAvt);
adminRouter.patch("/approved-report/:reportId", AdminVerify, ApproveReport);
adminRouter.patch("/block-report/:reportId", AdminVerify, BlockReport);

// location [MAP]
adminRouter.get("/getalllocation", AdminVerify, getLocationsForMap);

//commision
adminRouter.post("/commision", AdminVerify, addcommison);
// adminRouter.get("/getcommision", AdminVerify, getcommission);

adminRouter.get("/searchcommision", AdminVerify, searchCommissions);

//all experiences 
adminRouter.get("/getalltour", AdminVerify, getAllExperience);


// devices
adminRouter.post("/adddevices", AdminVerify, addDevices);
adminRouter.get("/getalldevices",AdminVerify, GetAllDevices);
adminRouter.get("/getalldevicesall", GetAllWithoutDevices);
adminRouter.delete("/deletedevices/:id", AdminVerify, deleteDevices);
adminRouter.patch("/updatedevices/:id", AdminVerify, updateDevices);
adminRouter.patch("/edituser/:id",upload.single("file"),AdminVerify,Edituser);
//add user

adminRouter.patch("/reportstatus/:id",AdminVerify,updatestatusreport)

adminRouter.post("/addnewuser",upload.single("file"),AdminVerify,addUser);
adminRouter.get("/avatarreport",AdminVerify,avatarreport);
// write by me
adminRouter.get("/getreportedavtar",AdminVerify,avtarReportQuery)
adminRouter.get("/getreportexperience",AdminVerify,experienceReportQuery)
adminRouter.delete("/deletereportexperience/:id",AdminVerify,experienceDeleteQuery)

adminRouter.get("/getuser/:id",AdminVerify,getuserId);
adminRouter.get("/commision",AdminVerify,getcommission);
adminRouter.post('/updatecommision',AdminVerify,updateCommission);
adminRouter.get("/expreport",AdminVerify,expreport);
adminRouter.get("/allavathons",AdminVerify, getAllAvathons);
adminRouter.get("/avathon/:id",AdminVerify, getAvathonbyid);


adminRouter.patch("/action/:id",AdminVerify,acceptAvathons);
import express from 'express';
import { verifyToken } from "../../Middleware/Auth.js";

import { uploadMiddleware } from "../../Middleware/multer.js";
import {
    getrequests,
    available,
    // allOffers,
    acceptOffer,
    Addexperience,
    editExperience,
    deleteExperience,
    avatardetails,
    handleBookingRequest,
    offerdetails,getExp,  addLocation,
    getlocation,allavatars,createMeeting,getAvatardetail,AvtRating,recentreq,avatarEarning,getAvailable ,chatwithuser,offernoti,getOffernoti,createAvathons,
    deleteAvathons
  } from "../../Controllers/avatar/avatarController.js";
  import { checkout,Paypalcheckout,Addstripe,withdrawInstant,refunds,payout, allstripedetails,AddPaypal,getPaypaldetails ,allpaypaldetails, withdrawpaypal} from '../../Controllers/User/PaymentController.js';
import { bookavathons } from '../../Controllers/User/avathonController.js';
import { Addavathons, editAvathons, myavathons } from '../../Controllers/avatar/avathonsController.js';


export const avatarRouter = express.Router();




avatarRouter
.get("/allavatars",allavatars)
.get("/chatwithuser",verifyToken,chatwithuser)
.get("/getExp",verifyToken,getExp)
.get("/getlocation", verifyToken, getlocation)
.get("/getrequests", verifyToken, getrequests)
.get("/avatardetails", verifyToken, avatardetails)
.get("/offerdetails/:id", verifyToken, offerdetails)
.get("/avatardetail/:id",getAvatardetail)
.get("/recent",verifyToken,recentreq )
.get('/avatarEarning',verifyToken,avatarEarning)
.get('/getAvailable',verifyToken,getAvailable )
.get("/getOffernoti",verifyToken,getOffernoti)
.get('/getpaypal',verifyToken,getPaypaldetails)
.get('/myavathons',verifyToken,myavathons)
  .post("/Addexperience", verifyToken,uploadMiddleware, Addexperience)
  .post("/handleBookingRequest/:requestId", verifyToken, handleBookingRequest)
  .post("/available", verifyToken, available)
  .post("/addLocation", verifyToken, addLocation)
  .post("/createMeeting",verifyToken, createMeeting)
  .post("/AvatarRating/:aid" ,verifyToken,AvtRating)  
   .post("/checkout",verifyToken,checkout)
   .post('/offernoti',verifyToken,offernoti)
   .post('/createavathons',verifyToken,uploadMiddleware,Addavathons)
   
   
.post("/payCheckout",verifyToken,Paypalcheckout)
.post("/addstripe", verifyToken, Addstripe)
.get("/allstripedetails", verifyToken, allstripedetails)
.get("/allpaypaldetails", verifyToken, allpaypaldetails)

.post("/refunds",verifyToken,refunds)
.post("/withdraw",verifyToken, withdrawInstant)
.post("/withdrawpaypal",verifyToken, withdrawpaypal)
.post('/addpaypal',verifyToken,AddPaypal)

.patch("/Editexperience/:id", verifyToken,uploadMiddleware, editExperience)
  .patch("/deleteExperience/:id", verifyToken, deleteExperience)
  .patch("/acceptOffer/:id", verifyToken, acceptOffer)
.patch("/deeleteAvathons/:id",verifyToken,deleteAvathons)
.patch("/editavathons/:id",verifyToken,uploadMiddleware,editAvathons)

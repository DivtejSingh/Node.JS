import express from 'express';
import { linkedinid, linkedinscrap, linkedinstopcompain } from '../controllers/linkedinscrap.js';

import { authmiddleware } from '../middlewares/jwtauth.js';
import { runjob } from '../controllers/automation.js';
import { checkAllReplies, checkemailreplied, checkoutlookreplied, checkSMTPCredentials, checksmtpreplied, scrapemail, sendemail, sendemailSMTP, stopcompain } from '../controllers/emailscrap.js';

export const apiRouter = express.Router();


apiRouter.post("/scrap",authmiddleware,linkedinscrap)
.post("/getprofile",linkedinid)
.post("/startjob",authmiddleware,runjob)

.post("/scrapemail",authmiddleware,scrapemail)
.post('/sendemail',authmiddleware,sendemail)
.post('/emaillogin',authmiddleware,sendemailSMTP)
.post('/reply',checkemailreplied)
.post('/replyoutlook',checkoutlookreplied)
.post('/checksmtp',authmiddleware,checkSMTPCredentials)
.post('/checkreply',checksmtpreplied)
.get('/cronjob',checkAllReplies)
.post('/stopcompain',authmiddleware,stopcompain)
.post('/pausescrap',authmiddleware,linkedinstopcompain)


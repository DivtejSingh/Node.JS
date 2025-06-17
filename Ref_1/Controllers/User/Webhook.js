import Stripe from 'stripe';
import { Payment } from '../../Models/User/Payment.js';
import { sendEmail } from '../../services/EmailServices.js';
import { Refund } from '../../Models/User/RefundModel.js';
import { TourInfo } from '../../Models/User/TourInfo.js';
import { Contract } from '../../Models/User/Contract.js';
import { Booking } from '../../Models/User/bookingModel.js';
import crypto from 'crypto'
import https from 'https'
import { Dispute } from '../../Models/User/DisputeModel.js';
import { Tip } from '../../Models/Avatar/Tipmodel.js';
import { BookingAddon } from '../../Models/User/BookingAddon.js';
import { avathonJoinNotification, notifyAvatarUserJoined, paymentSuccessEmail } from '../../services/CreateEmail.js';
import { PublicJoin } from '../../Models/User/PublicJoin.js';
import { userProfile } from '../../Models/User/userProfile.js';
import { Account } from '../../Models/User/Account.js';
import { Offer } from '../../Models/User/offerMode.js';
import { User } from '../../Models/User/userModel.js';
import { Meeting } from '../../Models/User/MeetingModel.js';
import { avathonPayment } from '../../Models/User/AvathonPayment.js';
import { Avathons } from '../../Models/Avatar/Avathons.js';
const stripeClient = new Stripe(`${process.env.STRIPE_Client}`);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;





export const paymentwebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Use the raw body of the request
    const payload = req.body;

    // Directly use the signature from headers
    event = stripeClient.webhooks.constructEvent(payload, sig, endpointSecret);
 
    // Handle the event based on its type
    switch (event.type) {
   
      case "checkout.session.completed":
        
        const session = event.data.object;
        const sessionId = session.id;
        const paymentIntentId = session.payment_intent;
        const currency = session.currency;

  
      
        const paymentSuccess = await Payment.findOne({ SessionId: sessionId });
        
         //avathon success
         const avathonSuccess = await avathonPayment.findOne({ SessionId: sessionId });
      if(avathonSuccess){
        avathonSuccess.status = "Succeeded";
        avathonSuccess.paymentIntentId = paymentIntentId;
        avathonSuccess.currency = currency;
        await avathonSuccess.save();

          let userId = avathonSuccess.userId;
           
                let avathonId= avathonSuccess.avathonId;
                let userDetails = await User.findOne({_id:userId});
              
                let userName = userDetails.userName;
                let email = userDetails.email;
                let avathodetails = await Avathons.findOne({_id:avathonId});
                let avataremail = avathodetails?.avataremail
                
                sendEmail(email,"Successfully Joined the Avathon",avathonJoinNotification(userName,avathodetails))
        
                sendEmail(avataremail ,"A User joined Your Avathons",notifyAvatarUserJoined(userName,avathodetails))
        

        let updatethisone = await Avathons.findOne({_id:avathonSuccess.avathonId});
        if(updatethisone){
          updatethisone.joinedMembers = (updatethisone.joinedMembers || 0) + 1;
          await updatethisone.save();
        }
      }


        if (paymentSuccess) {
          paymentSuccess.status = "Succeeded";
          paymentSuccess.paymentIntentId = paymentIntentId;
          paymentSuccess.currency = currency;
          paymentSuccess.paymentdata = session;
          
          await paymentSuccess.save();



          let email = await User.findOne({_id:paymentSuccess.userId});
       
          sendEmail(email.email,"Payment Success", paymentSuccessEmail(email,paymentSuccess));
        }
          
          if(paymentSuccess.OfferId){
            let findoutprice = paymentSuccess.price || 0;
    
            let findcommission = await userProfile.findOne({userId:paymentSuccess.avatarId,role:"avatar"});
            let avatarcommision = findcommission.avatarcommission;
            let admincommision = avatarcommision/100*findoutprice;
            
            let finalprice = findoutprice-admincommision;
           
        
            let updateuserAccount = await Account.findOne({to:paymentSuccess.avatarId});
        
            if(updateuserAccount){
              updateuserAccount.OfferPrice += finalprice;
              updateuserAccount.avatarcommision +=admincommision
              let add = parseInt(updateuserAccount.totalEarning);
           
              let total = add + finalprice;
              
              updateuserAccount.totalEarning = total;
              await updateuserAccount.save();
              
            }
            else{
                let newAcc = new Account({
                  from:paymentSuccess.userId,
                  to:paymentSuccess.avatarId,
                 
                  OfferPrice:finalprice,
                  totalEarning:finalprice,
                  avatarcommision:admincommision
                })
                await newAcc.save();
            }
        
           }
       else{
        console.log("not found");
        }

        let bookingsuccess = await BookingAddon.findOne({ SessionId: sessionId });
        if (bookingsuccess) {
          bookingsuccess.paymentStatus = "Succeeded";
          await bookingsuccess.save();
          
          // Update the duration of meeting and booking based on payment addon
          let meeting = await Meeting.findOne({ _id: bookingsuccess.meetingId });
          let account = await Account.findOne({ to: meeting.AvatarID });
          let booking = await Booking.findOne({ _id: meeting.bookingId });
          
          let price = bookingsuccess.price;
          
          // Update the account with the additional time purchased
          if (account) {
            account.addmoreTime += price;
            account.totalEarning += price;
            await account.save();
          } else {
            let newAccount = new Account({
              addmoreTime: price,
              totalEarning: price
            });
            await newAccount.save();
          }

          // Update meeting duration
          let additionalTime = bookingsuccess.currentDuration;
          if (meeting) {
            meeting.duration += additionalTime;
            const addtimeInMs = additionalTime * 60 * 1000; // Convert minutes to milliseconds
            meeting.endTime = new Date(meeting.endTime.getTime() + addtimeInMs);
            await meeting.save();
          }

          // Update booking duration
          if (booking) {
            booking.Duration += additionalTime;
            await booking.save();
          }
        }
    ///confirm for public join
    let updateaccount = await PublicJoin.findOne({ SessionId: sessionId });
    if (updateaccount) {
      updateaccount.status ="Succeeded";
      updateaccount.paymentIntentId = paymentIntentId;
      updateaccount.paymentdata=session;
      await updateaccount.save();
    }
    let findoutprice = updateaccount.price;
    
    let findcommission = await userProfile.findOne({userId:updateaccount.avatarId,role:"avatar"});
    let avatarcommision = findcommission.avatarcommission;
    let admincommision = avatarcommision/100*findoutprice;
    
    let finalprice = findoutprice-admincommision;
   

    let updateuserAccount = await Account.findOne({to:updateaccount.avatarId});

    if(updateuserAccount){
      updateuserAccount.publicJoin += finalprice;
      updateuserAccount.avatarcommision +=admincommision
      let add = parseInt(updateuserAccount.totalEarning);
   
      let total = add + finalprice;
      
      updateuserAccount.totalEarning = total;
      await updateuserAccount.save();
      
    }
    else{
        let newAcc = new Account({
          from:updateaccount.userId,
          to:updateaccount.avatarId,
          publicJoin:finalprice,
          totalEarning:finalprice,
          avatarcommision:admincommision
        })
        await newAcc.save();
    }







        let updatebooking   = await Booking.findOne({PaymentintendId:sessionId});
        if(updatebooking){
          updatebooking.payStatus=1;
          await updatebooking.save();
        }
  
        let updateOffer = await Offer.findOne({paymentIntentId:sessionId});
        if(updateOffer){
          updateOffer.paystatus="Succeeded";
          await updateOffer.save();
        }

       

        const contract = await Contract.findOne({SessionId:sessionId});
        if(contract){
          contract.status="Active";
          contract.paymentIntentId =paymentIntentId
          await contract.save();
        } 
        const tourinfo = await TourInfo.findOne({SessionId:sessionId});
        if(tourinfo){
          tourinfo.PaymentStatus="Succeeded";
          await tourinfo.save();
        }

        const tipinfo = await Tip.findOne({SessionId:sessionId});
        if(tipinfo){
          tipinfo.status="Succeeded",
          tipinfo.PaymentIntentId=paymentIntentId;
          await tipinfo.save() 
        }

        const updateoffer = await Payment.findOne({ SessionId: sessionId });
        if(updateoffer){
          updateoffer.status = "Succeeded";
          updateoffer.paymentIntentId = paymentIntentId;
          updateoffer.currency = currency;
          updateoffer.paymentdata = session;
          
          await updateoffer.save();
        }
        break;

      case "charge.updated":
        const chargeSession = event.data.object;
        const chargeSessionId = chargeSession.id;
        const chargePaymentIntentId = chargeSession.payment_intent;
        const chargeCurrency = chargeSession.currency;
 
    
        // Update payment status to 'Succeeded'

       //avathon payment 
       const avathonSuccesss = await avathonPayment.findOne({ SessionId: chargeSessionId });
       if(avathonSuccesss){
         avathonSuccesss.status = "Succeeded";
         avathonSuccesss.paymentIntentId = chargePaymentIntentId;
         avathonSuccesss.currency = chargeCurrency;
         await avathonSuccesss.save();
       }


        const paymentSuccessCharge = await Payment.findOne({ SessionId: chargeSessionId });
        if (paymentSuccessCharge) {
          paymentSuccessCharge.status = "Succeeded";
          paymentSuccessCharge.paymentIntentId = chargePaymentIntentId;
          paymentSuccessCharge.currency = chargeCurrency;
          await paymentSuccessCharge.save();
         
        }

        let ubookingsucess = await BookingAddon.findOne({SessionId:chargeSessionId});
 
   
         if(ubookingsucess){
          ubookingsucess.paymentStatus="Succeeded";
          await ubookingsucess.save();
          let findout = await Meeting.findOne({ _id: updatepayment.meetingId});
          let addmoney = await Account.findOne({to:findout.AvatarID});
          let updatebooking = await Booking.findOne({_id:findout.bookingId})

    
          let price = updatepayment.price;
          if(addmoney){
           addmoney.addmoreTime += price;
           let add = parseInt(addmoney.totalEarning);
            
           let total = add + price;
           
           addmoney.totalEarning = total;
     
           await addmoney.save();
          }
          else{
            let newAddmoney = new Account({
             addmoreTime:price,
             totalEarning:price
            })
            await newAddmoney.save();
          }
           
         let addtime = updatepayment.currentDuration;
    
         if(findout){
          let newduration = findout.duration + addtime;
          findout.duration=newduration;
  
          await findout.save();
         }
         if(updatebooking){
          let newduration =  updatebooking.Duration + addtime;
          updatebooking.Duration = newduration;
          await updatebooking.save()
         }


         }


        break;

      case "charge.succeeded":
        const chargeSucceeded = event.data.object;
        const chargeSucceededSessionId = chargeSucceeded.id;
        const chargeSucceededPaymentIntentId = chargeSucceeded.payment_intent;
        const chargeSucceededCurrency = chargeSucceeded.currency;

        // Update payment status to 'Succeeded'
        const paymentSuccessChargeSucceeded = await Payment.findOne({ SessionId: chargeSucceededSessionId });
        if (paymentSuccessChargeSucceeded) {
          paymentSuccessChargeSucceeded.status = "Succeeded";
          paymentSuccessChargeSucceeded.paymentIntentId = chargeSucceededPaymentIntentId;
          paymentSuccessChargeSucceeded.currency = chargeSucceededCurrency;
          await paymentSuccessChargeSucceeded.save();
        }
        const successdcontract = await Contract.findOne({SessionId:sessionId});
        if(successdcontract){
          successdcontract.status="Active";
        
          await successdcontract.save();
        }
        break;

      case "payment_intent.created":
        const paymentIntent = event.data.object;
        const paymentIntentIdCreated = paymentIntent.id;
        const paymentIntentCurrency = paymentIntent.currency;

        const avathonS = await avathonPayment.findOne({ 
          paymentIntentId: paymentIntentIdCreated });
        if(avathonS){
          avathonS.status = "Succeeded";
          avathonS.paymentIntentId = paymentIntentIdCreated;
          avathonS.currency = paymentIntentCurrency;
          await avathonS.save();
        }
 

     


        // Assuming you want to create a new Payment entry or update an existing one
        let paymentCreated = await Payment.findOne({ paymentIntentId: paymentIntentIdCreated });

        if (!paymentCreated) {
          paymentCreated = new Payment({
            paymentIntentId: paymentIntentIdCreated,
            status: "Created",
            currency: paymentIntentCurrency,
          });
        } else {
          paymentCreated.status = "Succeeded";
          paymentCreated.currency = paymentIntentCurrency;
        }
        await paymentCreated.save();
        break;
      
      
        case "charge.refunded":
        try{
          const refundIntent = event.data.object;
          const refundintentId = refundIntent.payment_intent;
    
          let refundcreated = await Refund.findOne({paymentIntentId:refundintentId});
          if(refundcreated){
              refundcreated.status=refundIntent.status,
              refundcreated.refunddata=refundIntent;
           
              refundcreated.refundId =refundIntent.id;
              refundcreated.receipturl = refundIntent.receipt_url
              await refundcreated.save();
  
  
          }
         // for dispute one
          let disputecreated = await Dispute.findOne({paymentIntentId:refundintentId});
          if(disputecreated){
            disputecreated.status = refundIntent.status,
            disputecreated.disputedata = refundIntent,
           
            disputecreated.disputeId = refundIntent.id,
            disputecreated.receipturl = refundIntent.receipt_url
            await disputecreated.save();
          }
          let refundcontract = await Contract.findOne({paymentIntentId:refundintentId})
            
          if(refundcontract){
            refundcontract.status="Refund";
            await refundcontract.save();
          }
          return res.status(200).json({message:"Refund successfully created"})
        }catch(err){
          return res.json({message:err.message})
        }

        break;
      

        case "charge.refund.updated":
          try{
            const refundIntent = event.data.object;
            const refundintentId = refundIntent.payment_intent;
        
            let refundcreated = await Refund.findOne({paymentIntentId:refundintentId});
            if(refundcreated){
                refundcreated.status=refundIntent.status,
                refundcreated.refunddata=refundIntent;
               
                refundcreated.refundId =refundIntent.id;
                refundcreated.receipturl = refundIntent.receipt_url
                await refundcreated.save();
    
    
            }
          }catch(err){
            console.log(err);
            return res.json({message:err.message})
          }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  
    res.status(200).send('Webhook received successfully');
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};








export const paypalwebhook = async(req,res)=>{
  const webhookEvent = req.body;
 

 let PaymentId  = webhookEvent.resource.parent_payment;
  // Handle different event types
  // switch (webhookEvent.event_type) {


  //   case 'PAYMENT.SALE.COMPLETED':
  //     // Handle payment completion
    
  //     let updatestatus = await Payment.findOne({paymentIntentId:PaymentId});
  //     if(updatestatus){
  //       updatestatus.status="Succeeded"
  //       await updatestatus.save();
  //     } 
  //     let email = await User.findOne({_id:updatestatus.userId});
  //     sendEmail(email,"Payment Success", paymentSuccessEmail(email,updatestatus));
  //     let updateOfferstatus = await Payment.findOne({paymentIntentId:PaymentId});
  //     if(updateOfferstatus){
  //       updateOfferstatus.status="Succeeded"
  //       await updateOfferstatus.save();
  //     }
    
  
  //     break;
  //   case 'PAYMENT.SALE.DENIED':
  //     let failedstatus = await Payment.findOne({paymentIntentId:PaymentId});
  //     if(failedstatus){
  //       failedstatus.status="Pending"
  //       await failedstatus.save();
  //     }
  
  //     break;
  //   case 'PAYMENT.SALE.REFUNDED':
  //     let updateStatus = await Dispute.findOne({paymentIntentId:PaymentID});
  //     if(updateStatus){
  //       updateStatus.status="Refunded"
  //       await updateStatus.save();
  //     }
  //       console.log("refunded");
  //     break;
  //   case 'PAYMENT.REFUND.COMPLETED':
  //     console.log("payment refund");
  //     break;

  //   default:
  //     console.log('Unhandled event type:', webhookEvent.event_type);
  // }

  // Send a response back to PayPal
  res.status(200).send('Event received');
}






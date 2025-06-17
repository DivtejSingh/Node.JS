import Stripe from "stripe";
import { Payment } from "../../Models/User/Payment.js"; // Adjust the path as necessary
import { sendEmail } from "../../services/EmailServices.js";
import { Booking } from "../../Models/User/bookingModel.js";
import paypal from "paypal-rest-sdk";
import pay from "@paypal/checkout-server-sdk";
import { User } from "../../Models/User/userModel.js";
import { Addacc } from "../../Models/User/Addaccount.js";
import { Tip } from "../../Models/Avatar/Tipmodel.js";
import { Refund } from "../../Models/User/RefundModel.js";
import { Account } from "../../Models/User/Account.js";
import { Contract } from "../../Models/User/Contract.js";
import { Request } from "../../Models/User/requestModel.js";

import { PublicJoin } from "../../Models/User/PublicJoin.js";
import { BookingAddon } from "../../Models/User/BookingAddon.js";
import {
  stripeAccountSuccessEmail,
  refundSuccessEmail,
  accountConnectedEmail,
  accountupdateConnectedEmail,
  stripeAccountAddedAdminNotification,
  avatarWithdrawNotification,
} from "../../services/CreateEmail.js";
import axios from "axios";
import { Meeting } from "../../Models/User/MeetingModel.js";
import { Experience } from "../../Models/Avatar/ExperienceModel.js";
import { Offer } from "../../Models/User/offerMode.js";
import { userProfile } from "../../Models/User/userProfile.js";
import { TourInfo } from "../../Models/User/TourInfo.js";
import { PaypalAcc } from "../../Models/User/Paypalacc.js";
paypal.configure({
  mode: "sandbox",
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET_ID,
});

const environment = new pay.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_SECRET_ID
);
const paypalClient = new pay.core.PayPalHttpClient(environment);

const stripeClient = new Stripe(process.env.STRIPE_Client); // Initialize Stripe with your secret key
export const checkout = async (req, res) => {
  try {
    const {
      productId,
      product,
      avatarId,
      reqid,
      bookingId,
      price,
      Adminfee,
      paymentType,
    } = req.body;

    const { _id } = req.user;
    const findbooking = await Booking.findOne({ _id: bookingId });
    const prices = price - Adminfee;

    const parsedPrice = parseFloat(price);

    // Construct the line item for Stripe checkout session
    const lineItem = {
      price_data: {
        currency: "usd",
        product_data: {
          name: product,
        },
        unit_amount: Math.round(parsedPrice * 100), // Stripe requires amounts in cents
      },
      quantity: 1,
    };

    // Create Stripe checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [lineItem],
      mode: "payment",
      success_url: `${process.env.WEBSITE_URL}/user/paymentsuccess`,
      cancel_url: `${process.env.WEBSITE_URL}/user/paymentfailed`,
    });

    // Create a new payment record in the database
    let date = new Date();
    const payment = new Payment({
      userId: _id,
      packageId: productId,
      avatarId,
      bookingId,
      price: prices,
      adminFee: Adminfee,
      totalprice: parsedPrice,
      SessionId: session.id,
      currency: "usd",
      status: "Pending",
      paymentType: paymentType,
    });

    findbooking.PaymentintendId = session.id;

    await findbooking.save();

    let doc = await payment.save();
    const newContract = new Contract({
      userId: _id,
      AvatarId: avatarId,
      status: "Pending",
      SessionId: session.id,
      PaymentId: doc._id,
    });

    await newContract.save();
    //check if it is alredy exist or not
    let existingType = await Account.findOne({
      to: avatarId,
      Method: "stripe",
    });
    if (existingType) {
    } else {
      const newAddmethod = new Account({
        from: _id,
        to: avatarId,
        Method: "stripe",
      });
      await newAddmethod.save();
    }

    // Send response back with session ID
    return res.status(200).json({ id: session.id, isSuccess: true });
  } catch (err) {
    console.error("Error during checkout:", err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

export const Paypalcheckout = async (req, res) => {
  try {
    const {
      productId,
      product,
      reqid,
      avatarId,
      bookingId,
      price,
      Adminfee,
      paymentType,
    } = req.body;
    const { _id } = req.user;

    const findbooking = await Booking.findOne({ _id: bookingId });
    const prices = price - Adminfee;

    const parsedPrice = parseFloat(price);

    const letdetails = await User.findOne({ _id });
    if (!letdetails) {
      return res
        .status(404)
        .json({ message: "User not found", isSuccess: false });
    }

    const Name = letdetails.userName;
    const email = letdetails.email;
    const [firstName, lastName] = Name.split(" ");

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
        payer_info: {
          first_name: firstName || "",
          last_name: lastName || "",
          email: `${email}`,
        },
      },
      redirect_urls: {
        // "return_url": `${process.env.BACKEND_URL}/success`,
        return_url: `${process.env.BACKEND_URL}/success`,
        cancel_url: `${process.env.WEBSITE_URL}/user/paymentfailed`,
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: `${product}`,
                sku: "item",
                price: parsedPrice, // Price in USD (no conversion needed here)
                currency: "USD",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "USD",
            total: parsedPrice, // Must match the sum of the items
          },
          description: "This is the payment description.",
        },
      ],
    };

    await paypal.payment.create(create_payment_json, async (error, payment) => {
      if (error) {
        console.error("PayPal API error:", error);
        return res
          .status(400)
          .json({ message: error.message, isSuccess: false });
      } else {
        const paymentRecord = new Payment({
          userId: _id,
          packageId: productId,
          avatarId,
          bookingId,
          price: prices,
          totalprice: parsedPrice,

          adminFee: Adminfee,
          paymentIntentId: payment.id,
          currency: "USD",
          status: "Pending",
          paymentType: paymentType,
        });

        await paymentRecord.save();
        let findOut = await Experience.findOne({ _id: productId });
        let existingType = await Account.findOne({
          to: avatarId,
          Method: "paypal",
        });
        if (existingType) {
        } else {
          const newAddmethod = new Account({
            from: _id,
            to: avatarId,
            Method: "paypal",
          });
          await newAddmethod.save();
        }

        const findBooking = await Booking.findOne({ _id: bookingId });
        if (findBooking) {
          findBooking.PaymentintendId = payment.id;

          await findBooking.save();
        }

        const approvalUrl = payment.links.find(
          (link) => link.rel === "approval_url"
        );
        if (approvalUrl) {
          return res
            .status(200)
            .json({ url: approvalUrl.href, isSuccess: true });
        } else {
          return res
            .status(500)
            .json({ message: "Approval URL not found", isSuccess: false });
        }
      }
    });
  } catch (err) {
    console.error("Error during PayPal checkout:", err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

export const paymentsuccess = async (req, res) => {
  try {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    // Find the payment using the payment ID
    const findpayment = await Payment.findOne({ paymentIntentId: paymentId });
    if (!findpayment) {
      return res.status(404).send("Payment not found.");
    }

    // Extract the original amount from the payment record
    const totalAmount = findpayment.totalprice; // Use the dynamic total from the payment record

    // Express checkout object, including amount details
    const express_checkout_json = {
      payer_id: payerId,
      transactions: [
        {
          amount: {
            currency: "USD",
            total: totalAmount, // Use the correct total amount
          },
          description: "This is the payment description",
        },
      ],
    };

    // Execute the payment with PayPal
    paypal.payment.execute(
      paymentId,
      express_checkout_json,
      async function (error, payment) {
        const captureId = payment.transactions[0].related_resources[0].sale.id;

        if (error) {
          console.log("PayPal payment execution error:", error.response);
          return res.redirect(`${process.env.WEBSITE_URL}/user/paymentfailed`);
          if (error.response && error.response.details) {
            console.log("Validation Error Details:", error.response.details);
          }
          return res.status(400).send("Payment execution failed.");
        } else {
          const response = JSON.stringify(payment);
          const parseresponse = JSON.parse(response);

          // Update the payment status in the database
          let updateaccount = await Payment.findOne({
            paymentIntentId: paymentId,
          });
          if (updateaccount) {
            updateaccount.status = "Succeeded";
            updateaccount.payerId = payerId;
            updateaccount.captureId = captureId;
            await updateaccount.save();

            if (updateaccount.OfferId) {
              let findoutprice = updateaccount.price;

              let findcommission = await userProfile.findOne({
                userId: updateaccount.avatarId,
                role: "avatar",
              });
              let avatarcommision = findcommission.avatarcommission.toFixed(2);
              let admincommision = (avatarcommision / 100) * findoutprice;

              let finalprice = findoutprice - admincommision;

              let updateuserAccount = await Account.findOne({
                to: updateaccount.avatarId,
              });

              if (updateuserAccount) {
                updateuserAccount.OfferPrice += finalprice;
                updateuserAccount.avatarcommision += admincommision;
                let add = parseInt(updateuserAccount.totalEarning);

                let total = add + finalprice;

                updateuserAccount.totalEarning = total;
                await updateuserAccount.save();
              } else {
                let newAcc = new Account({
                  from: updateaccount.userId,
                  to: updateaccount.avatarId,

                  OfferPrice: finalprice,
                  totalEarning: finalprice,
                  avatarcommision: admincommision,
                });
                await newAcc.save();
              }
            }
          }

          let updatebooking = await Booking.findOne({
            PaymentintendId: paymentId,
          });
          if (updatebooking) {
            updatebooking.payStatus = 1;
            await updatebooking.save();
          }
          let updateOffer = await Offer.findOne({ paymentIntentId: paymentId });
          if (updateOffer) {
            updateOffer.paystatus = "Succeeded";
            await updateOffer.save();
          }

          return res.redirect(`${process.env.WEBSITE_URL}/user/paymentsuccess`);
        }
      }
    );
  } catch (err) {
    console.log("Error in paymentsuccess function:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const Addstripe = async (req, res) => {
  const { _id } = req.user;
  const { email, countryCode, country } = req.body;

  let user = await User.findOne({ _id: _id });
  let username = user.userName;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", isSuccess: false });
    }

    let stripeAccount = await Addacc.findOne({ UserID: _id });

    if (stripeAccount) {
      const updatedStripeAccount = await stripeClient.accounts.update(
        stripeAccount.stripeAccountId,
        { email: email }
      );

      stripeAccount.stripeEmail = email;
      stripeAccount.country = country;
      await stripeAccount.save();
      sendEmail(
        email,
        "Stripe Account Update Successfully",
        accountupdateConnectedEmail(username, email)
      );
      return res.status(200).json({
        message: "Stripe account updated successfully",
        isSuccess: true,
        stripeAccountId: updatedStripeAccount.id,
      });
    } else {
      const capabilities = {
        transfers: { requested: true },
      };
      if (countryCode === "GI") {
        capabilities.card_payments = { requested: true };
      }

      const newStripeAccount = await stripeClient.accounts.create({
        type: "custom",
        country: countryCode,
        email: email,

        capabilities: capabilities,
        business_profile: {
          mcc: "5734", // Example MCC for software services
          product_description: "Freelance software development services",
        },
        tos_acceptance: {
          service_agreement: ["GI", "US"].includes(countryCode)
            ? "full"
            : "recipient", // Fixes the ternary condition
          date: Math.floor(Date.now() / 1000), // Current Unix timestamp
          ip: req.ip, // Use the request IP address
        },
      });

      const newStripeAcc = new Addacc({
        UserID: _id,
        stripeAccountId: newStripeAccount.id,
        stripeEmail: email,
        country: country,
        PaymentMethod: "stripe",
      });
      await newStripeAcc.save();

      const accountLink = await stripeClient.accountLinks.create({
        account: newStripeAccount.id,
        refresh_url: "https://www.avatarwalk.com/avatar/stripe", // Replace with your actual refresh URL
        return_url: "https://www.avatarwalk.com/avatar/bank", // Replace with your actual return URL
        type: "account_onboarding",
      });

      // Add a bank account for payouts using test bank account details

      sendEmail(
        email,
        "Stripe Account Added Successfully ",
        accountConnectedEmail(username, email)
      );
      sendEmail(
        process.env.EMAIL_USER,
        "A New Stripe Account ",
        stripeAccountAddedAdminNotification(username, email)
      );
      return res.status(201).json({
        message: "Stripe account added successfully",
        isSuccess: true,
        stripeAccountId: newStripeAccount.id,
        url: accountLink.url,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

export const AddPaypal = async (req, res) => {
  const { name, email } = req.body;
  const { _id } = req.user;

  try {
    // Check if the PayPal account is already linked
    let exist = await PaypalAcc.findOne({ userId: _id });

    if (exist) {
      // If account exists, update PayPal info
      exist.paypalName = name;
      exist.paypalEmail = email;
      await exist.save();

      return res.status(200).json({
        message: "Account Updated Successfully",
        isSuccess: true,
        // Provide the PayPal onboarding link to complete the connection
      });
    } else {
      // If no PayPal account exists, create a new entry
      const newAcc = new PaypalAcc({
        userId: _id,
        paypalEmail: email,
        paypalName: name,
      });
      await newAcc.save();

      // Generate onboarding link for this new account
      const onboardingLink = await createOnboardingLink(email);

      return res.status(200).json({
        message: "Account Added Successfully",
        isSuccess: true,
        onboardingLink: onboardingLink, // Provide the onboarding link for PayPal account setup
      });
    }
  } catch (err) {
    console.error("Error adding PayPal account:", err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

async function createOnboardingLink(email) {
  try {
    // Step 1: Obtain OAuth token for PayPal API access (sandbox environment)
    const authResponse = await axios.post(
      "https://api.sandbox.paypal.com/v1/oauth2/token",
      new URLSearchParams({
        grant_type: "client_credentials",
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET_ID}`
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = authResponse.data.access_token; // Extract the access token for PayPal API calls

    // Step 2: Create a partner referral for the user to onboard with PayPal
    const partnerReferralResponse = await axios.post(
      "https://api.sandbox.paypal.com/v2/customer/partner-referrals", // Using sandbox URL for testing
      {
        email: email,
        tracking_id: "unique_tracking_id", // Tracking ID to correlate with your system
        partner_config_override: {
          return_url: "https://yourwebsite.com/merchantonboarded", // URL to return to after onboarding
          return_url_description:
            "URL to redirect after the onboarding process is complete",
          show_add_credit_card: true, // Optionally show a prompt for adding a credit card
        },
        operations: [
          {
            operation: "API_INTEGRATION",
            api_integration_preference: {
              rest_api_integration: {
                integration_method: "PAYPAL",
                integration_type: "THIRD_PARTY",
                third_party_details: {
                  features: ["PAYMENT", "REFUND", "PARTNER_FEE"], // Features you need for the partner
                },
              },
            },
          },
        ],
        // Products you want to offer through PayPal
        products: ["PAYMENT_METHODS"], // Products you want to offer through PayPal
        capabilities: [
          "APPLE_PAY", // Standard PayPal payments
        ], // Optional: specify capabilities
        legal_consents: [
          {
            type: "SHARE_DATA_CONSENT",
            granted: true, // Consent for sharing data
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Pass the OAuth token
          "Content-Type": "application/json",
        },
      }
    );

    const partnerReferralData = partnerReferralResponse.data;

    if (partnerReferralResponse.status == 201) {
      // If successful, return the PayPal onboarding link for the user to complete the process
      const onboardingLink = partnerReferralData.links.find(
        (link) => link.rel === "action_url"
      ).href;
      return onboardingLink;
    } else {
      console.log("error");
    }
  } catch (error) {
    console.error("Error creating PayPal onboarding link:", error.message);
    throw new Error("Failed to generate PayPal onboarding link");
  }
}

export const getPaypaldetails = async (req, res) => {
  const { _id } = req.user;
  try {
    let userdata = await PaypalAcc.findOne({ userId: _id });
    if (userdata) {
      return res
        .status(200)
        .json({
          message: "Successfully fetched",
          data: userdata,
          isSuccess: true,
        });
    } else {
      return res
        .status(200)
        .json({ message: "No data found", data: {}, isSuccess: false });
    }
  } catch (err) {
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};

export const withdrawpaypal = async (req, res) => {
  const { StripeEmail, amount } = req.body;
  const { _id } = req.user;

  try {
    const getAccessToken = async () => {
      const response = await axios.post(
        "https://api-m.sandbox.paypal.com/v1/oauth2/token",
        "grant_type=client_credentials",
        {
          auth: {
            username: process.env.PAYPAL_CLIENT_ID,
            password: process.env.PAYPAL_SECRET_ID,
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.data.access_token;
    };

    const sendPayout = async (StripeEmail, amount) => {
      const accessToken = await getAccessToken();
      const payoutData = {
        sender_batch_header: {
          sender_batch_id: `batch_${Date.now()}`,
          email_subject: "You have received a payout!",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: {
              value: amount,
              currency: "USD",
            },
            receiver: StripeEmail,
            note: "Thanks for using our service!",
            sender_item_id: `item_${Date.now()}`,
          },
        ],
      };

      const response = await axios.post(
        "https://api-m.sandbox.paypal.com/v1/payments/payouts",
        payoutData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    };

    const payoutResponse = await sendPayout(StripeEmail, amount);
    let findacc = await Account.findOne({ to: _id, Method: "paypal" });
    let totalamount = findacc.totalEarning;
    let update = parseInt(totalamount) - amount;
    findacc.totalEarning = update;
    await findacc.save();

    // Return Success Response
    res.status(200).json({
      message: "Recipient added and payout processed successfully",
      recipient: StripeEmail,
      payoutResponse,
      success: true,
    });
  } catch (err) {}
};

export const refunds = async (req, res) => {
  const { bookingId } = req.body;
  const { _id } = req.user;
  try {
    // fetch the payment_intent ids
    let user = await User.findOne({ _id: _id });

    const paymentinfo = await Payment.findOne({ bookingId: bookingId });
    let updateStatus = await Booking.findOne({ _id: bookingId });
    if (updateStatus) {
      updateStatus.status = "";
    }

    const totalamount = paymentinfo.price * 100;
    const finalprice = Math.floor(totalamount);
    const paymentType = paymentinfo.paymentType;
    let refund;

    if (!paymentinfo) {
      return res
        .status(404)
        .json({ message: "Invalid Request", isSuccess: false });
    }
    if (paymentType === "paypal") {
      const captureId = paymentinfo.captureId; // Assuming this is the PayPal capture ID

      if (!captureId) {
        return res
          .status(400)
          .json({ error: "Capture ID is required", isSuccess: false });
      }
      const refundRequest = new pay.payments.CapturesRefundRequest(captureId);

      refundRequest.requestBody({
        amount: {
          value: (finalprice / 100).toFixed(2), // PayPal expects amount in the format like 100.00
          currency_code: paymentinfo.currency,
        },
      });
      const response = await paypalClient.execute(refundRequest);

      if (response.statusCode !== 201) {
        return res
          .status(response.statusCode)
          .json({ error: "Failed to process PayPal refund", isSuccess: false });
      }

      refund = response.result;
    } else if (paymentType === "stripe") {
      refund = await stripeClient.refunds.create({
        payment_intent: paymentinfo.paymentIntentId,
        amount: finalprice,
      });
      // sendEmail(user.email,"Successfully refunded",refundSuccessEmail(user))
      return res
        .status(200)
        .json({ message: "Successfully refunded", isSuccess: true });
    }
  } catch (err) {
    console.log(err.message);
    return res
      .status(404)
      .json({ message: "You have already Refunded ", isSuccess: false });
  }
};

// refund if the user cancelled

export const refundForuser = async (req, res) => {
  const { bookingId, cancelledBy } = req.body; // `cancelledBy` should indicate who canceled ('user' or 'avatar')

  const { _id } = req.user; // Assuming _id is user ID

  try {
    const user = await User.findOne({ _id: _id });
    // Fetch payment information using bookingId
    const paymentInfo = await Payment.findOne({
      bookingId: bookingId,
      status: "Succeeded",
    });

    if (!paymentInfo) {
      return res.status(404).json({ message: "Invalid Request" });
    }

    // Calculate the total amount in cents (assuming price is in the main currency unit like USD)
    const totalAmount = paymentInfo.price * 100;

    let refundAmount,
      avatarAmount = 0,
      adminAmount;

    if (cancelledBy === "user") {
      // Calculate distribution amounts when canceled by the user
      refundAmount = Math.floor(totalAmount * 0.8); // 80% to the user
      avatarAmount = Math.floor(totalAmount * 0.1); // 10% to the avatar
    } else if (cancelledBy === "avatar") {
      // Calculate distribution amounts when canceled by the avatar
      refundAmount = Math.floor(totalAmount * 0.9); // 90% to the user
    }

    adminAmount = totalAmount - (refundAmount + avatarAmount); // Remaining to admin

    let refund;

    // Refund 80% or 90% to the user based on payment type (PayPal or Stripe)
    if (paymentInfo.paymentType === "paypal") {
      // PayPal refund logic
      const captureId = paymentInfo.captureId;

      if (!captureId) {
        return res.status(400).json({ error: "Capture ID is required" });
      }

      const refundRequest = new pay.payments.CapturesRefundRequest(captureId);

      refundRequest.requestBody({
        amount: {
          value: (refundAmount / 100).toFixed(2),
          currency_code: paymentInfo.currency,
        },
      });

      const response = await paypalClient.execute(refundRequest);

      if (response.statusCode !== 201) {
        return res
          .status(response.statusCode)
          .json({ error: "Failed to process PayPal refund" });
      }

      refund = response.result;

      let findrefund = await Refund.findOne({
        paymentIntentId: paymentInfo.paymentIntentId,
      });
      if (findrefund) {
        findrefund.status = "Succeeded";
        findrefund.refunddata = response;
        await findrefund.save();
      }

      if (cancelledBy === "user" && avatarAmount > 0) {
        let findOne = await Account.findOne({ to: paymentInfo.avatarId });
        if (findOne) {
          findOne.RefundCommision += avatarAmount;
          findOne.PaymentId.push(paymentInfo._id);
          findOne.totalEarning = parseInt(findOne.totalEarning) + avatarAmount;
          await findOne.save();
        } else {
          findOne = new Account({
            from: _id,
            to: paymentInfo.avatarId,
            RefundCommision: avatarAmount,
            PaymentId: [paymentInfo._id],
            totalEarning: avatarAmount,
          });
          await findOne.save();
        }
      }
    } else if (paymentInfo.paymentType === "stripe") {
      // Stripe refund logic
      refund = await stripeClient.refunds.create({
        payment_intent: paymentInfo.paymentIntentId,
        amount: refundAmount,
      });

      if (cancelledBy === "user" && avatarAmount > 0) {
        let findOne = await Account.findOne({ to: paymentInfo.avatarId });
        if (findOne) {
          findOne.RefundCommision += avatarAmount;
          findOne.PaymentId.push(paymentInfo._id);
          findOne.totalEarning = parseInt(findOne.totalEarning) + avatarAmount;
          await findOne.save();
        } else {
          findOne = new Account({
            from: _id,
            to: paymentInfo.avatarId,
            RefundCommision: avatarAmount,
            PaymentId: [paymentInfo._id],
            totalEarning: avatarAmount,
          });
          await findOne.save();
        }
      }
    }

    sendEmail(user.email, "Successfully refunded", refundSuccessEmail(user));

    return res.status(200).json({
      message: "Successfully processed refund",
      refund,
      isSuccess: true,
    });
  } catch (err) {
    console.log(err.message);
    return res
      .status(500)
      .json({ message: "You have already Refunded", isSuccess: false });
  }
};

export const payout = async (req, res) => {
  const { _id } = req.user;
  const { to, price, reqid } = req.body;

  try {
    // Find the user making the payout
    let findOut = await userProfile.findOne({ userId: to, role: "avatar" });
    let avatarcommision = findOut.avatarcommission;
    let commissionprice = (avatarcommision / 100) * price;
    const totalprice = price - commissionprice;

    let findid = await User.findOne({ _id: _id });

    if (findid) {
      // Find or create the account record
      let existingAcc = await Account.findOne({ to: to, Method: "stripe" });

      if (existingAcc) {
        // Append the new price to the TourPrice array
        existingAcc.TourPrice.push(parseFloat(totalprice));
        existingAcc.avatarcommision += commissionprice;

        // Recalculate the totalEarning, ensuring all TourPrice values are numbers
        const tourEarning = existingAcc.TourPrice.reduce(
          (acc, curr) => acc + parseFloat(curr),
          0
        );

        // If there is another earning, add it to the total
        const additionalEarning = existingAcc.totalEarning
          ? parseFloat(existingAcc.totalEarning)
          : 0;

        // Calculate the new total earning including any additional earnings
        existingAcc.totalEarning = (tourEarning + additionalEarning).toFixed(2); // Format to 2 decimal places

        await existingAcc.save();
      } else {
        // Create a new account if it does not exist
        let newAcc = new Account({
          from: _id,
          to: to,
          TourPrice: [parseFloat(totalprice)],
          totalEarning: parseFloat(totalprice).toFixed(2),
          avatarcommision: commissionprice,
        });

        await newAcc.save();
      }
      let existingAccc = await Account.findOne({ to: to, Method: "paypal" });

      if (existingAccc) {
        // Append the new price to the TourPrice array
        existingAccc.TourPrice.push(parseFloat(totalprice));
        existingAccc.avatarcommision += commissionprice;

        // Recalculate the totalEarning, ensuring all TourPrice values are numbers
        const tourEarning = existingAccc.TourPrice.reduce(
          (acc, curr) => acc + parseFloat(curr),
          0
        );

        // If there is another earning, add it to the total
        const additionalEarning = existingAccc.totalEarning
          ? parseFloat(existingAccc.totalEarning)
          : 0;

        // Calculate the new total earning including any additional earnings
        existingAccc.totalEarning = (tourEarning + additionalEarning).toFixed(
          2
        ); // Format to 2 decimal places

        await existingAccc.save();
      } else {
        // Create a new account if it does not exist
        let newAcc = new Account({
          from: _id,
          to: to,
          TourPrice: [parseFloat(totalprice)],
          totalEarning: parseFloat(totalprice).toFixed(2),
          avatarcommision: commissionprice,
        });

        await newAcc.save();
      }

      let updateTour = await TourInfo.findOne({ reqId: reqid });
      if (updateTour) {
        updateTour.Status = "Completed";
        updateTour.Start = 0;
        await updateTour.save();
      }
      // Update request and booking status
      let updateComplete = await Request.findOne({ _id: reqid });

      if (updateComplete) {
        updateComplete.status = "Completed";
        await updateComplete.save();
      }

      let updatebooking = await Booking.findOne({
        _id: updateComplete.bookingId,
      });

      if (updatebooking) {
        updatebooking.status = "Completed";
        await updatebooking.save();
      }

      return res.status(200).json({ message: "Completed", isSuccess: true });
    }
  } catch (error) {
    return res.status(404).json({ message: error.message, isSuccess: false });
  }
};

//transfer to the user

export const withdrawInstant = async (req, res) => {
  const { StripeEmail, amount } = req.body;
  const { _id } = req.user;

  if (!StripeEmail || !amount) {
    return res.status(404).json({ error: "Please add A Stripe Account" });
  }

  const amountInCents = Math.round(parseFloat(amount) * 100);
  let withdrawalDate = new Date();
  let formattedDate = withdrawalDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  try {
    let findid = await Addacc.findOne({ UserID: _id });
    let getuser = await User.findOne({ _id: _id });
    let avatarname = getuser.userName;

    if (!findid) {
      return res.status(404).json({ message: "Stripe account not found" });
    }

    let stripeId = findid.stripeAccountId;
    const transfer = await stripeClient.transfers.create({
      amount: amountInCents,
      currency: "usd",
      destination: stripeId,
    });
    // reduce the amount from total one
    let findacc = await Account.findOne({ to: _id, Method: "stripe" });
    let totalamount = findacc.totalEarning;
    let update = parseInt(totalamount) - amount;
    findacc.totalEarning = update;
    await findacc.save();
    res.status(200).json({ success: true });
    sendEmail(
      StripeEmail,
      "Successfully Withdraw",
      avatarWithdrawNotification(avatarname, amount, formattedDate)
    );
  } catch (err) {
    console.error("Error creating instant payout:", err);
    res
      .status(500)
      .json({
        error:
          "StripeInvalidRequestError: Your destination account needs to have at least one of the following capabilities enabled: transfers, crypto_transfers, legacy_payments.",
      });
  }
};

export const allstripedetails = async (req, res) => {
  const { _id } = req.user;
  try {
    let findid = await User.findOne({ _id: _id });
    let details = await Addacc.findOne({ UserID: _id });

    if (findid && details) {
      details.stripeAccountId == undefined;
      return res
        .status(200)
        .json({
          message: "successfully fetched",
          data: details,
          isSuccess: true,
        });
    } else {
      return res
        .status(200)
        .json({ message: "Not found", data: {}, isSuccess: false });
    }
  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};
export const allpaypaldetails = async (req, res) => {
  const { _id } = req.user;
  try {
    let findid = await User.findOne({ _id: _id });
    let details = await PaypalAcc.findOne({ userId: _id });

    if (findid && details) {
      details.stripeAccountId == undefined;
      return res
        .status(200)
        .json({
          message: "successfully fetched",
          data: details,
          isSuccess: true,
        });
    } else {
      return res
        .status(200)
        .json({ message: "Not found", data: {}, isSuccess: false });
    }
  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: err.message, isSuccess: false });
  }
};

export const avtartip = async (req, res) => {
  try {
    const { avatarId, bookingId, tip, paymentType } = req.body;

    const { _id } = req.user;
    const tips = parseInt(tip);

    if (isNaN(tips)) {
      return res
        .status(400)
        .json({ message: "Invalid tip value", isSuccess: false });
    }

    // Construct the line item for Stripe checkout session
    const lineItem = {
      price_data: {
        currency: "usd",
        product_data: {
          name: "Avatar Tip",
        },
        unit_amount: Math.round(tips * 100), // Stripe requires amounts in cents
      },
      quantity: 1,
    };

    // Create Stripe checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [lineItem],
      mode: "payment",
      success_url: `${process.env.WEBSITE_URL}/user/tipsuccess`,
      cancel_url: `${process.env.WEBSITE_URL}/user/paymentfailed`,
    });

    // Create a new payment record in the database
    let date = new Date();
    const Tippayment = new Tip({
      from: _id,
      bookingId: bookingId,
      to: avatarId,
      tip: tips,

      SessionId: session.id,
      currency: "usd",
      status: "Pending",
      paymentType: paymentType,
    });
    let savetip = await Account.findOne({ to: avatarId });
    if (savetip) {
      savetip.Tip += tips;
      let add = parseInt(savetip.totalEarning);

      let total = add + tips;

      savetip.totalEarning = total;

      await savetip.save();
    }

    let doc = await Tippayment.save();
    const newContract = new Contract({
      userId: _id,
      AvatarId: avatarId,
      status: "Pending",
      SessionId: session.id,
      PaymentId: doc._id,
    });

    await newContract.save();

    // Send response back with session ID
    return res.status(200).json({ id: session.id, isSuccess: true });
  } catch (err) {
    console.error("Error during checkout:", err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

export const paypalavttip = async (req, res) => {
  const { avatarId, bookingId, tip, paymentType } = req.body;
  const { _id } = req.user;

  // Validate the tip input before proceeding
  const tips = parseInt(tip);

  if (isNaN(tips)) {
    return res
      .status(400)
      .json({ message: "Invalid tip value", isSuccess: false });
  }

  try {
    const letdetails = await User.findOne({ _id });
    if (!letdetails) {
      return res
        .status(404)
        .json({ message: "User not found", isSuccess: false });
    }

    const Name = letdetails.userName;
    const email = letdetails.email;
    const [firstName, lastName] = Name.split(" ");

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
        payer_info: {
          first_name: firstName || "",
          last_name: lastName || "",
          email: `${email}`,
        },
      },
      redirect_urls: {
        return_url: `${process.env.BACKEND_URL}/paysuccess`,
        cancel_url: `${process.env.WEBSITE_URL}/user/paymentfailed`,
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: "Tip",
                sku: "item",
                price: tips, // Price in USD
                currency: "USD",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "USD",
            total: tips, // Must match the sum of the items
          },
          description: "This is the payment description.",
        },
      ],
    };

    await paypal.payment.create(create_payment_json, async (error, payment) => {
      if (error) {
        console.error("PayPal API error:", error);
        return res
          .status(400)
          .json({ message: error.message, isSuccess: false });
      } else {
        const Tippayment = new Tip({
          from: _id,
          bookingId: bookingId,
          to: avatarId,
          tip: tips,
          SessionId: payment.id,
          currency: "usd",
          status: "Pending",
          paymentType: paymentType,
        });

        await Tippayment.save();

        let savetip = await Account.findOne({ to: avatarId });
        if (savetip) {
          savetip.Tip += tips;
          let add = parseInt(savetip.totalEarning);

          let total = add + tips;

          savetip.totalEarning = total;

          await savetip.save();
        }

        let doc = await Tippayment.save();
        const newContract = new Contract({
          userId: _id,
          AvatarId: avatarId,
          status: "Pending",
          SessionId: payment.id,
          PaymentId: doc._id,
        });

        await newContract.save();

        const approvalUrl = payment.links.find(
          (link) => link.rel === "approval_url"
        );
        if (approvalUrl) {
          return res
            .status(200)
            .json({ url: approvalUrl.href, isSuccess: true });
        } else {
          return res
            .status(500)
            .json({ message: "Approval URL not found", isSuccess: false });
        }
      }
    });
  } catch (err) {
    console.error("Error during PayPal checkout:", err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

export const tipsuccess = async (req, res) => {
  try {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    // Find the payment using the payment ID
    const findpayment = await Tip.findOne({ SessionId: paymentId });
    if (!findpayment) {
      return res.status(404).send("Payment not found.");
    }

    // Extract the original amount from the payment record
    const totalAmount = findpayment.tip; // Use the dynamic total from the payment record

    // Express checkout object, including amount details
    const express_checkout_json = {
      payer_id: payerId,
      transactions: [
        {
          amount: {
            currency: "USD",
            total: totalAmount, // Use the correct total amount
          },
          description: "This is the payment description",
        },
      ],
    };

    // Execute the payment with PayPal
    paypal.payment.execute(
      paymentId,
      express_checkout_json,
      async function (error, payment) {
        if (error) {
          console.log("PayPal payment execution error:", error.response);

          if (error.response && error.response.details) {
            console.log("Validation Error Details:", error.response.details);
            return res.redirect(
              `${process.env.WEBSITE_URL}/user/paymentfailed`
            );
          }
        } else {
          const response = JSON.stringify(payment);

          const parseresponse = JSON.parse(response);

          // Update the payment status in the database
          let updateaccount = await Tip.findOne({ SessionId: paymentId });
          if (updateaccount) {
            updateaccount.status = "Succeeded";
            updateaccount.payerId = payerId;
            await updateaccount.save();
          }

          // Update the tour status in the database

          // Redirect to the success page
          return res.redirect(`${process.env.WEBSITE_URL}/user/tipsuccess`);
        }
      }
    );
  } catch (err) {
    console.log("Error in paymentsuccess function:", err);
    res.status(500).send("Internal Server Error");
  }
};

// add more time for pay
export const payaddon = async (req, res) => {
  try {
    const { addmoretime, meetingId, paymenttype } = req.body;
    const { _id } = req.user;

    let addtime = addmoretime + 5;

    // Find the meeting and booking
    let findout = await Meeting.findOne({ _id: meetingId });
    let findoutbooking;
    let amountperminute;
    if (findout) {
      findoutbooking = await Booking.findOne({ _id: findout.bookingId });
      amountperminute = findoutbooking.amountPerminute;
    }

    let price = amountperminute * addtime;

    if (paymenttype === "stripe") {
      const lineItem = {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Add More Time",
          },
          unit_amount: Math.round(price * 100), // Stripe requires amounts in cents
        },
        quantity: 1,
      };

      // Create Stripe checkout session
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [lineItem],
        mode: "payment",
        success_url: `${process.env.WEBSITE_URL}/user/addtimepaymentsuccess`,
        cancel_url: `${process.env.WEBSITE_URL}/user/paymentfailed`,
      });

      // Find meeting info
      let findMeetingInfo = await Meeting.findOne({ _id: meetingId });
      if (!findMeetingInfo) {
        return res
          .status(404)
          .json({ message: "Meeting not found", isSuccess: false });
      }

      let prevDuration = findMeetingInfo.duration;
      let reqId = findMeetingInfo.ReqId;
      let event_id = findMeetingInfo.eventId;

      // Check if there's an existing addon
      let existingAddon = await BookingAddon.findOne({ meetingId: meetingId });
      if (existingAddon) {
        existingAddon.addDuration.push(addtime);
        (existingAddon.currentDuration = addtime),
          (existingAddon.SessionId = session.id),
          await existingAddon.save();
      } else {
        let newAddon = new BookingAddon({
          meetingId: meetingId,
          prevDuration: prevDuration,
          addDuration: [addtime],
          currentDuration: addtime,
          event_id: event_id,
          reqId: reqId,
          price: price,
          SessionId: session.id,
          currency: "usd",
          paymentStatus: "Pending",
        });
        await newAddon.save();
      }

      let updatedAddon = await BookingAddon.findOne({ meetingId: meetingId });
      let totalAddDuration = updatedAddon.addDuration.reduce(
        (acc, time) => acc + time,
        0
      );
      let totalDuration = prevDuration + totalAddDuration;

      updatedAddon.Totalduration = totalDuration;
      await updatedAddon.save();

      return res.status(200).json({ id: session.id, isSuccess: true });
    }

    // PayPal case
    else if (paymenttype === "paypal") {
      const parsedPrice = parseFloat(price).toFixed(2);

      const letdetails = await User.findOne({ _id });

      if (!letdetails) {
        return res
          .status(404)
          .json({ message: "User not found", isSuccess: false });
      }

      const Name = letdetails.userName;
      const email = letdetails.email;
      const [firstName, lastName] = Name.split(" ");

      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
          payer_info: {
            first_name: firstName || "",
            last_name: lastName || "",
            email: `${email}`,
          },
        },
        redirect_urls: {
          return_url: `${process.env.BACKEND_URL}/payaddmoretime`,
          cancel_url: `${process.env.WEBSITE_URL}/user/paymentfailed`,
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: "Tip",
                  sku: "item",
                  price: parsedPrice, // Price in USD
                  currency: "USD",
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: "USD",
              total: parsedPrice, // Must match the sum of the items
            },
            description: "This is the payment description.",
          },
        ],
      };

      await paypal.payment.create(
        create_payment_json,
        async (error, payment) => {
          if (error) {
            console.error("PayPal API error:", error);
            return res
              .status(400)
              .json({ message: error.message, isSuccess: false });
          } else {
            let findMeetingInfo = await Meeting.findOne({ _id: meetingId });
            if (!findMeetingInfo) {
              return res
                .status(404)
                .json({ message: "Meeting not found", isSuccess: false });
            }

            let prevDuration = findMeetingInfo.duration;
            let reqId = findMeetingInfo.ReqId;
            let event_id = findMeetingInfo.eventId;

            // Check if there's an existing addon
            let existingAddon = await BookingAddon.findOne({
              meetingId: meetingId,
            });
            if (existingAddon) {
              existingAddon.addDuration.push(addtime);
              existingAddon.SessionId = payment.id;
              existingAddon.price = price;
              (existingAddon.currentDuration = addtime),
                await existingAddon.save();
            } else {
              let newAddon = new BookingAddon({
                meetingId: meetingId,
                prevDuration: prevDuration,
                addDuration: [addtime],
                event_id: event_id,
                reqId: reqId,
                price: price,
                currentDuration: addtime,

                SessionId: payment.id,
                currency: "usd",
                paymentStatus: "Pending",
              });
              await newAddon.save();
            }

            const approvalUrl = payment.links.find(
              (link) => link.rel === "approval_url"
            );
            if (approvalUrl) {
              return res
                .status(200)
                .json({ url: approvalUrl.href, isSuccess: true });
            } else {
              return res
                .status(500)
                .json({ message: "Approval URL not found", isSuccess: false });
            }
          }
        }
      );
    }
  } catch (err) {
    console.error("Error during checkout:", err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

export const addsuccess = async (req, res) => {
  try {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    // Find the payment using the payment ID
    const findpayment = await BookingAddon.findOne({ SessionId: paymentId });
    if (!findpayment) {
      return res.status(404).send("Payment not found.");
    }

    // Express checkout object, including amount details
    const express_checkout_json = {
      payer_id: payerId,
      transactions: [
        {
          amount: {
            currency: "USD",
            total: findpayment.price.toFixed(2), // Correct total
          },
          description: "This is the payment description", // Optional
        },
      ],
    };

    // Execute the payment with PayPal
    paypal.payment.execute(
      paymentId,
      express_checkout_json,
      async function (error, payment) {
        if (error) {
          console.log("PayPal payment execution error:", error.response);

          if (error.response && error.response.details) {
            console.log("Validation Error Details:", error.response.details);
            return res.redirect(
              `${process.env.WEBSITE_URL}/user/paymentfailed`
            );
          }
        } else {
          const response = JSON.stringify(payment);
          const parseresponse = JSON.parse(response);
          const updatepayment = await BookingAddon.findOne({
            SessionId: paymentId,
          });
          if (updatepayment) {
            updatepayment.paymentStatus = "Succeeded";
            await updatepayment.save();
          }
          // if the payment success then

          let findout = await Meeting.findOne({ _id: updatepayment.meetingId });
          let updatebooking = await Booking.findOne({ _id: findout.bookingId });
          let addmoney = await Account.findOne({ to: findout.AvatarID });
          let price = updatepayment.price;
          if (addmoney) {
            addmoney.addmoreTime += price;
            let add = parseInt(addmoney.totalEarning);

            let total = add + price;

            addmoney.totalEarning = total;

            await addmoney.save();
          } else {
            let newAddmoney = new Account({
              addmoreTime: price,
              totalEarning: price,
            });
            await newAddmoney.save();
          }

          let addtime = updatepayment.currentDuration;

          if (findout) {
            findout.duration += addtime;
            const addtimeInMs = addtime * 60 * 1000; // Convert minutes to milliseconds
            findout.endTime = new Date(findout.endTime.getTime() + addtimeInMs);
            await findout.save();
          }
          if (updatebooking) {
            updatebooking.Duration += addtime;
            await updatebooking.save();
          }

          // Update the payment status in the database

          // Redirect to the success page
          return res.redirect(
            `${process.env.WEBSITE_URL}/user/addtimepaymentsuccess`
          );
        }
      }
    );
  } catch (err) {
    console.log("Error in paymentsuccess function:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const publicJoin = async (req, res) => {
  try {
    const {
      product,
      productId,
      avatarId,
      userId,
      bookingId,
      price,
      adminFee,
      paymentType,
    } = req.body;
    const { _id } = req.user;
    const findbooking = await Booking.findOne({ _id: bookingId });

    const totalcharges = adminFee + price;
    let finalprice = totalcharges.toFixed(2);

    //avatar commission
    let findOut = await userProfile.findOne({
      userId: avatarId,
      role: "avatar",
    });
    let avatarcommision = findOut.avatarcommission;
    let commissionprice = (avatarcommision / 100) * price;
    const totalprice = price - commissionprice;

    // Construct the line item for Stripe checkout session
    const lineItem = {
      price_data: {
        currency: "usd",
        product_data: {
          name: product,
        },
        unit_amount: Math.round(finalprice * 100), // Stripe requires amounts in cents
      },
      quantity: 1,
    };

    // Create Stripe checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [lineItem],
      mode: "payment",
      success_url: `${process.env.WEBSITE_URL}/user/Payment_Success_Join_Room`,
      cancel_url: `${process.env.WEBSITE_URL}/user/paymentfailed`,
    });

    // Create a new payment record in the database
    let date = new Date();
    const payment = new PublicJoin({
      userId: userId,
      packageId: productId,
      avatarId,
      bookingId,
      price: price,
      totalprice: finalprice,
      adminFee: adminFee,
      SessionId: session.id,
      currency: "usd",
      status: "Pending",
      paymentType: paymentType,
    });
    let findmeeting = await Meeting.findOne({ bookingId: bookingId });
    if (findmeeting) {
      findmeeting.joiners.push(userId);
      await findmeeting.save();
    }

    await payment.save();

    let findAccount = await Account.findOne({ to: avatarId });
    if (findAccount) {
      findAccount.publicJoin += totalprice;
      let add = parseInt(findAccount.totalEarning);

      let total = add + price;

      findAccount.totalEarning = total;

      await findAccount.save();
    }

    let doc = await payment.save();
    const newContract = new Contract({
      userId: _id,
      AvatarId: avatarId,
      status: "Pending",
      SessionId: session.id,
      PaymentId: doc._id,
    });

    await newContract.save();

    // Send response back with session ID
    return res.status(200).json({ id: session.id, isSuccess: true });
  } catch (err) {
    console.error("Error during checkout:", err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

export const publicJoinPaypal = async (req, res) => {
  try {
    const {
      product,
      productId,
      avatarId,
      userId,
      bookingId,
      price,
      adminFee,
      paymentType,
    } = req.body;
    const { _id } = req.user;
    const totalcharges = adminFee + price;
    let finalprice = totalcharges.toFixed(2);

    const findbooking = await Booking.findOne({ _id: bookingId });

    //findout the avatar commission
    let findOut = await userProfile.findOne({
      userId: avatarId,
      role: "avatar",
    });
    let avatarcommision = findOut.avatarcommission;
    let commissionprice = (avatarcommision / 100) * price;
    const totalprice = price - commissionprice;

    const letdetails = await User.findOne({ _id });
    if (!letdetails) {
      return res
        .status(404)
        .json({ message: "User not found", isSuccess: false });
    }

    const Name = letdetails.userName;
    const email = letdetails.email;
    const [firstName, lastName] = Name.split(" ");

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
        payer_info: {
          first_name: firstName || "",
          last_name: lastName || "",
          email: `${email}`,
        },
      },
      redirect_urls: {
        return_url: `${process.env.BACKEND_URL}/publicsuccess`,
        cancel_url: `${process.env.WEBSITE_URL}/user/paymentfailed`,
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: `${product}`,
                sku: "item",
                price: finalprice, // Price in USD (no conversion needed here)
                currency: "USD",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "USD",
            total: finalprice, // Must match the sum of the items
          },
          description: "This is the payment description.",
        },
      ],
    };

    await paypal.payment.create(create_payment_json, async (error, payment) => {
      if (error) {
        console.error("PayPal API error:", error);
        return res
          .status(400)
          .json({ message: error.message, isSuccess: false });
      } else {
        const paymentRecord = new PublicJoin({
          userId: userId,
          packageId: productId,
          avatarId,
          bookingId,
          price: price,
          totalprice: finalprice,
          adminFee: adminFee,
          paymentIntentId: payment.id,
          currency: "USD",
          status: "Pending",
          paymentType: paymentType,
        });

        await paymentRecord.save();

        let findmeeting = await Meeting.findOne({ bookingId: bookingId });
        if (findmeeting) {
          findmeeting.joiners.push(userId);
          await findmeeting.save();
        }
        let findAccount = await Account.findOne({ to: avatarId });
        if (findAccount) {
          findAccount.publicJoin += totalprice;
          let add = parseInt(findAccount.totalEarning);

          let total = add + price;

          findAccount.totalEarning = total;

          await findAccount.save();
        }

        const approvalUrl = payment.links.find(
          (link) => link.rel === "approval_url"
        );
        if (approvalUrl) {
          return res
            .status(200)
            .json({ url: approvalUrl.href, isSuccess: true });
        } else {
          return res
            .status(500)
            .json({ message: "Approval URL not found", isSuccess: false });
        }
      }
    });
  } catch (err) {
    console.error("Error during PayPal checkout:", err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

export const publicjoinsuccess = async (req, res) => {
  try {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    // Find the payment using the payment ID
    const findpayment = await PublicJoin.findOne({
      paymentIntentId: paymentId,
    });
    if (!findpayment) {
      return res.status(404).send("Payment not found.");
    }

    // Extract the original amount from the payment record
    const totalAmount = findpayment.totalprice; // Use the dynamic total from the payment record

    // Express checkout object, including amount details
    const express_checkout_json = {
      payer_id: payerId,
      transactions: [
        {
          amount: {
            currency: "USD",
            total: totalAmount, // Use the correct total amount
          },
          description: "This is the payment description",
        },
      ],
    };

    // Execute the payment with PayPal
    paypal.payment.execute(
      paymentId,
      express_checkout_json,
      async function (error, payment) {
        const captureId = payment.transactions[0].related_resources[0].sale.id;

        if (error) {
          console.log("PayPal payment execution error:", error.response);
          return res.redirect(`${process.env.WEBSITE_URL}/user/paymentfailed`);
          if (error.response && error.response.details) {
            console.log("Validation Error Details:", error.response.details);
          }
          return res.status(400).send("Payment execution failed.");
        } else {
          const response = JSON.stringify(payment);
          const parseresponse = JSON.parse(response);

          // Update the payment status in the database
          let updateaccount = await PublicJoin.findOne({
            paymentIntentId: paymentId,
          });
          if (updateaccount) {
            updateaccount.status = "Succeeded";
            updateaccount.payerId = payerId;
            updateaccount.captureId = captureId;
            await updateaccount.save();
          }

          let findoutprice = updateaccount.price;

          let findcommission = await userProfile.findOne({
            userId: updateaccount.avatarId,
            role: "avatar",
          });
          let avatarcommision = findcommission.avatarcommission;
          let admincommision = (avatarcommision / 100) * findoutprice;

          let finalprice = findoutprice - admincommision;

          let updateuserAccount = await Account.findOne({
            to: updateaccount.avatarId,
          });

          if (updateuserAccount) {
            updateuserAccount.publicJoin += finalprice;
            updateuserAccount.avatarcommision += admincommision;
            let add = parseInt(updateuserAccount.totalEarning);

            let total = add + finalprice;

            updateuserAccount.totalEarning = total;
            await updateuserAccount.save();
          } else {
            let newAcc = new Account({
              from: updateaccount.userId,
              to: updateaccount.avatarId,
              publicJoin: finalprice,
              totalEarning: finalprice,
              avatarcommision: admincommision,
            });
            await newAcc.save();
          }

          // Update the tour status in the database

          // Redirect to the success page
          return res.redirect(
            `${process.env.WEBSITE_URL}/user/Payment_Success_Join_Room`
          );
        }
      }
    );
  } catch (err) {
    console.log("Error in paymentsuccess function:", err);
    res.status(500).send("Internal Server Error");
  }
};

//offercheckout
export const offercheckout = async (req, res) => {
  try {
    const { product, avatarId, OfferId, price, Adminfee, paymentType } =
      req.body;

    const { _id } = req.user;

    const prices = price - Adminfee;

    const parsedPrice = parseFloat(price);
    // Construct the line item for Stripe checkout session
    const lineItem = {
      price_data: {
        currency: "usd",
        product_data: {
          name: product,
        },
        unit_amount: Math.round(parsedPrice * 100), // Stripe requires amounts in cents
      },
      quantity: 1,
    };

    // Create Stripe checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [lineItem],
      mode: "payment",
      success_url: `${process.env.WEBSITE_URL}/user/offerpaymentsuccess`,
      cancel_url: `${process.env.WEBSITE_URL}/user/paymentfailed`,
    });

    // Create a new payment record in the database
    let date = new Date();
    const payment = new Payment({
      userId: _id,

      avatarId,
      OfferId,
      totalprice: parsedPrice,
      price: prices,
      adminFee: Adminfee,
      SessionId: session.id,
      currency: "usd",
      status: "Pending",
      paymentType: paymentType,
    });

    let updateoffer = await Offer.findOne({ _id: OfferId });
    if (updateoffer) {
      updateoffer.paymentIntentId = session.id;
      await updateoffer.save();
    }

    let doc = await payment.save();
    const newContract = new Contract({
      userId: _id,
      AvatarId: avatarId,
      status: "Pending",
      SessionId: session.id,
      PaymentId: doc._id,
    });

    await newContract.save();

    // Send response back with session ID
    return res.status(200).json({ id: session.id, isSuccess: true });
  } catch (err) {
    console.error("Error during checkout:", err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

export const offerPaypalcheckout = async (req, res) => {
  try {
    const { product, avatarId, OfferId, price, Adminfee, paymentType } =
      req.body;

    const { _id } = req.user;

    const prices = price - Adminfee;

    const parsedPrice = parseFloat(price);
    const letdetails = await User.findOne({ _id });
    if (!letdetails) {
      return res
        .status(404)
        .json({ message: "User not found", isSuccess: false });
    }

    const Name = letdetails.userName;
    const email = letdetails.email;
    const [firstName, lastName] = Name.split(" ");

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
        payer_info: {
          first_name: firstName || "",
          last_name: lastName || "",
          email: `${email}`,
        },
      },
      redirect_urls: {
        return_url: `${process.env.BACKEND_URL}/success`,
        //"return_url": `http://localhost:3000/success`,
        cancel_url: `${process.env.WEBSITE_URL}/user/paymentfailed`,
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: `${product}`,
                sku: "item",
                price: parsedPrice, // Price in USD (no conversion needed here)
                currency: "USD",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "USD",
            total: parsedPrice, // Must match the sum of the items
          },
          description: "This is the payment description.",
        },
      ],
    };

    await paypal.payment.create(create_payment_json, async (error, payment) => {
      if (error) {
        console.error("PayPal API error:", error);
        return res
          .status(400)
          .json({ message: error.message, isSuccess: false });
      } else {
        const paymentRecord = new Payment({
          userId: _id,

          avatarId,
          OfferId,
          totalprice: parsedPrice,
          price: prices,
          adminFee: Adminfee,
          paymentIntentId: payment.id,
          currency: "usd",
          status: "Pending",
          paymentType: paymentType,
        });

        await paymentRecord.save();

        let updateoffer = await Offer.findOne({ _id: OfferId });
        if (updateoffer) {
          updateoffer.paymentIntentId = payment.id;
          await updateoffer.save();
        }

        const approvalUrl = payment.links.find(
          (link) => link.rel === "approval_url"
        );
        if (approvalUrl) {
          return res
            .status(200)
            .json({ url: approvalUrl.href, isSuccess: true });
        } else {
          return res
            .status(500)
            .json({ message: "Approval URL not found", isSuccess: false });
        }
      }
    });
  } catch (err) {
    console.error("Error during PayPal checkout:", err);
    return res.status(500).json({ message: err.message, isSuccess: false });
  }
};

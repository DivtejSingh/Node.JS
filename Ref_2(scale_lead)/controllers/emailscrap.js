import axios from "axios";
import { sendEmail } from "../utils/Email/emailService.js";
import nodemailer from "nodemailer";
import { followupHtml } from "../utils/EmailTemplates/followupEmail.js";
import Imap from "imap";
import path from "path";
import cron from "node-cron";
import fs from "fs";
import { simpleParser } from "mailparser";
import { parentPort, isMainThread } from "worker_threads";
import qs from "qs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tokensFile = path.join(__dirname, "tokens.json");
const currentUserFile = path.join(__dirname, "current_user.json");

const start = path.join(__dirname, "start.json");
const currentcompain = path.join(__dirname, "currentcompain.json");

export const scrapemail = async (req, res) => {
  const { body } = req.body;
  const {
    sector,
    company_size,
    id,
    gtoken,
    mstoken,
    grefreshtoken,
    mrefreshtoken,
    gtokenexpire,
    mtokenexpire,
    user,
    uemail,
    memail,
    pass,
    message_delay
  } = body;

  let msgHeaderId;
  const token = req.token;
  const utoken = req.token;
  const { sub } = req.user;

  try {
    let tokens = [];
    let campaigns = [];
    if (fs.existsSync(tokensFile)) {
      const content = fs.readFileSync(tokensFile, "utf-8");
      tokens = JSON.parse(content);
    }

    // Check if an entry exists for this user
    const existingIndex = tokens.findIndex((t) => t.user_id === sub);

    if (existingIndex !== -1) {
      const existing = tokens[existingIndex];

      // ✅ If token is the same, skip updating
      if (existing.token === token) {
        console.log(
          `✅ Token already exists for user ${sub}, no update needed.`
        );
      } else {
        // ✅ Update token if it's different
        tokens[existingIndex].token = token;
        fs.writeFileSync(tokensFile, JSON.stringify(tokens, null, 2), "utf-8");
        console.log(`🔁 Token updated for user ${sub}`);
      }
    } else {
      // ✅ Add new entry if user_id doesn't exist
      tokens.push({
        user_id: sub,
        token: token,
      });
      fs.writeFileSync(tokensFile, JSON.stringify(tokens, null, 2), "utf-8");
    }
    //let entry new user
    const newUser = { user_id: sub, active: true };
    const newCampaign = { cid: id, active: true };
    let userList = [];
    let campaignList = [];
    // Step 5: Save current_user.json
    try {
      userList = JSON.parse(fs.readFileSync(currentUserFile, "utf-8") || "[]");
    } catch {
      userList = [];
    }

    try {
      campaignList = JSON.parse(
        fs.readFileSync(currentcompain, "utf-8") || "[]"
      );
    } catch {
      campaignList = [];
    }

    // Check if user_id already exists
    const userExists = userList.some((u) => u.user_id === newUser.user_id);

    // Check if cid already exists
    const campaignExists = campaignList.some((c) => c.cid === newCampaign.cid);

    // Push only if they don't exist
    if (!userExists) {
      userList.push(newUser);
    }

    if (!campaignExists) {
      campaignList.push(newCampaign);
    }

    // Save updated data back to files
    fs.writeFileSync(
      currentUserFile,
      JSON.stringify(userList, null, 2),
      "utf-8"
    );
    fs.writeFileSync(
      currentcompain,
      JSON.stringify(campaignList, null, 2),
      "utf-8"
    );
    //save the compain id with flag
    if (fs.existsSync(start)) {
      const fileContent = fs.readFileSync(start, "utf-8");
      campaigns = JSON.parse(fileContent);
    }

    // Step 2: Check if cid exists
    const index = campaigns.findIndex((item) => item.cid === id);

    if (index !== -1) {
      // Update existing entry
      campaigns[index].start = true;
    } else {
      // Add new entry
      campaigns.push({ start: true, cid: id, uid: sub,delay:message_delay });
    }

    // Step 3: Write back updated array
    fs.writeFileSync(start, JSON.stringify(campaigns, null, 2), "utf-8");

    // 1. Search for people
    const response = await axios.post(
      "https://api.apollo.io/api/v1/mixed_people/search",
      {
        page: 4,
        per_page: 1,
        person_titles: [sector],

        organization_num_employees_ranges: [company_size],
      },
      {
        headers: {
          "x-api-key": API_KEY,

          "Cache-Control": "no-cache",

          "Content-Type": "application/json",
        },
      }
    );

    const people = response.data.people || [];
    if (people.length === 0) {
      return res.status(404).json({ message: "No contacts found" });
    }

    // 2. Fetch detailed info from `/people/match`
    const detailedContacts = await Promise.all(
      people.map(async (person) => {
        try {
          const detailRes = await axios.get(
            `https://api.apollo.io/api/v1/people/match?id=${person.id}`,
            {
              headers: {
                "x-api-key": API_KEY,
              },
            }
          );

          const profile = detailRes.data.person || {};
          return {
            id: person.id,
            name: `${person.first_name} ${person.last_name}`,
            email: profile.email || "No email found",
            title: profile.title || person.title || "",
            company:
              profile.organization?.name || person.organization?.name || "",
            linkedin: profile.linkedin_url || person.linkedin_url || "",
            city: profile?.city || person?.city || "",
            state: profile?.state || person?.state || "",
            country: profile?.country || person?.country || "",
          };
        } catch (err) {
          console.warn(
            `⚠️ Failed to fetch match for ID ${person.id}:`,
            err.message
          );
          return null;
        }
      })
    );

    const validResults = detailedContacts.filter(Boolean);
    // let msgHeaderId =await sendViaGmail(gtoken, lead.email);

    const campaignId = id;
    const leadsWithMsgId = [];
    const checkRes = await axios.get(
      `${process.env.BASE_URL}/api/email-leads/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const { data } = checkRes;

    // Step 2: Build a Set of all existing UIDs
    const existingUids = new Set(
      data.data.filter((item) => item.user_id == sub).map((item) => item.uid)
    );

    for (const lead of validResults) {
      if (existingUids.has(lead.id)) {
        console.log(`⏩ Skipping ${lead.email}, already exists in DB.`);
        continue;
      }
      try {
        if (gtoken !== undefined) {
          msgHeaderId = await sendViaGmail(
            gtoken,
          lead.email,
            utoken,
            lead.name
          );
        }
        if (user && pass) {
          msgHeaderId = await sendemailSMTP(
            user,
            pass,
            lead.email,
            utoken,
            lead.name
          );
        }

        if (mstoken !== undefined) {
          msgHeaderId = await sendViaMicrosoft(
            mstoken,
           lead.email,
            utoken,
            lead.name
          );

          if (msgHeaderId.success == false) {
            return res.json({
              message: "Token expire please login again ",
              isSuccess: false,
            });
          }
        }

        if (lead.email && lead.email !== "No email found") {
          leadsWithMsgId.push({
            user_email: uemail || memail || user,
            uid: lead.id,
            name: lead.name,
            email: lead.email,
            title: lead.title,
            company: lead.company,
            linkedin: lead.linkedin,
            State: lead.state,
            city: lead.city,
            country: lead.country,
            emailsend: true,
            replied: false,
            msgid: msgHeaderId,
            token: gtoken || mstoken || null,
            source: gtoken ? "gmail" : mstoken ? "outlook" : "smtp",
            refreshtoken: grefreshtoken || mrefreshtoken || null,
            expire_at: gtokenexpire || mtokenexpire || null,
            user: user,
            pass: pass,
          });
        }
      } catch (err) {
        console.error(`❌ Failed to send Gmail to ${lead.email}:`, err.message);
      }
    }

    if (leadsWithMsgId.length > 0) {
      const saveRes = await axios.post(
        `${process.env.BASE_URL}/api/email-leads`,
        {
          campaign_id: campaignId,
          leads: leadsWithMsgId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return res.status(200).json({
      message: "successfully stored",
      contacts: validResults,
      isSuccess: true,
    });
  } catch (error) {
    console.error(
      "❌ Error fetching contacts:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      message: "Failed to fetch contacts",
      error: error.response?.data || error.message,
      isSuccess: false,
    });
  }
};

// helper functions

const sendViaGmail = async (token, toEmail, utoken, name) => {
  try {
    // 1. ✅ Get the message template
    const messagetemplate = await axios.get(
      `${process.env.BASE_URL}/api/user/messages/latest`,
      {
        headers: {
          Authorization: `Bearer ${utoken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { data } = messagetemplate;
    let content = data?.data?.email_content;

    if (!content) {
      throw new Error("Email content not found in the template");
    }

    let editcontent = content.replace("[Director's Name]", `${name}`);

    // 2. ✉️ Compose message
    const message = [
      `To: ${toEmail}`,
      "Subject: Email From Scaleleads",
      "",
      `${editcontent}`,
    ].join("\n");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    // 3. 📤 Send email
    const response = await axios.post(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      { raw: encodedMessage },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let msgid = response.data.id;

    if (!msgid) {
      throw new Error("Message ID not returned from Gmail API");
    }

    // 4. 🧾 Get message details
    const detailRes = await axios.get(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgid}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          format: "metadata",
          metadataHeaders: ["Message-ID"],
        },
      }
    );

    const headers = detailRes?.data?.payload?.headers || [];
    const messageIdHeader = headers.find((h) => h.name === "Message-Id")?.value;

    return messageIdHeader || null;
  } catch (error) {
    return { success: false, status: error?.status };
  }
};

const sendViaMicrosoft = async (token, toEmail, utoken, name) => {
  let messagetemplate = await axios.get(
    `${process.env.BASE_URL}/api/user/messages/latest`,
    {
      headers: {
        Authorization: `Bearer ${utoken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const { data } = messagetemplate;

  let content = data?.data.email_content;
  let editcontent = content.replace("[Director's Name]", `${name}`);
  try {
    // Step 1: Create draft
    const draftRes = await axios.post(
      "https://graph.microsoft.com/v1.0/me/messages",
      {
        subject: "Outlook Test",
        body: {
          contentType: "Text",
          content: editcontent,
        },
        toRecipients: [{ emailAddress: { address: toEmail } }],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    let draftid = draftRes.data.id;

    const messageId = draftRes.data.internetMessageId; // ✅ This is the ID you can track later

    // Step 2: Send the message
    let response = await axios.post(
      `https://graph.microsoft.com/v1.0/me/messages/${draftid}/send`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return messageId || null;
  } catch (error) {
    return { success: false, status: error.status };
  }
};

export const sendemailSMTP = async (user, pass, toEmail, utoken, name) => {
  if (!user || !pass) {
    return;
  }

  const messageId = `<${Date.now()}-${Math.random()}@gmail.com>`;
  let messagetemplate = await axios.get(
    `${process.env.BASE_URL}/api/user/messages/latest`,
    {
      headers: {
        Authorization: `Bearer ${utoken}`,
        "Content-Type": "application/json",
      },
    }
  );
  const { data } = messagetemplate;
  let content = data?.data.email_content;
  let editcontent = content.replace("[Director's Name]", `${name}`);

  try {
    const transporterInstance = nodemailer.createTransport({
      host: "smtp.gmail.com", // Correct SMTP server
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: user,
        pass: pass,
      },
    });

    transporterInstance.verify((error, success) => {
      if (error) {
        console.error("SMTP verification failed:", error);
      } else {
        console.log("SMTP credentials are valid!");
      }
    });

    const sendmail = await sendEmail(
      transporterInstance,
      user,
      toEmail,
      "ScaleLead Email",
      `${editcontent}`
    );
    let messageId = sendmail?.messageId;
    return messageId;
  } catch (err) {
    console.log(err);
  }
};

export const checkSMTPCredentials = async (req, res) => {
  const { user, pass } = req.body;

  if (!user || !pass) {
    return res.json({
      message: "Email and app Password are required",
      isSuccess: false,
    });
  }

  try {
    const transporterInstance = nodemailer.createTransport({
      host: "smtp.gmail.com", // Correct SMTP server
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: user,
        pass: pass,
      },
    });

    transporterInstance.verify((error, success) => {
      if (error) {
        console.error("SMTP verification failed:", error);
        return res.json({
          message: "SMTP Verification Failed",
          isSuccess: false,
        });
      } else {
        console.log("SMTP credentials are valid!");
        return res.json({ message: "Successfully Login ", isSuccess: true });
      }
    });
  } catch (err) {
    return res.json(500).json({ message: err.message });
  }
};

//done
export const checkemailreplied = async (token, messageId) => {
  try {
    // Step 1: List inbox messages from last 3 days
    const listRes = await axios.get(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          maxResults: 10,
        },
      }
    );

    const messages = listRes.data.messages || [];

    // Step 2: Check each message for In-Reply-To
    for (const msg of messages) {
      const detailRes = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            format: "metadata",
            metadataHeaders: ["In-Reply-To", "References"],
          },
        }
      );

      const headers = detailRes.data.payload.headers;
      const inReplyTo = headers.find((h) => h.name == "In-Reply-To")?.value;
      const references = headers.find((h) => h.name == "References")?.value;

      if (
        inReplyTo == messageId ||
        (references && references.includes(messageId))
      ) {
        console.log(`✅ Reply found to message ID: ${messageId}`);
        return true;
      }
    }

    return { success: false };
  } catch (err) {
    return { success: false, status: err.status };
  }
};

export const checkoutlookreplied = async (token, messageId) => {
  if (!token || !messageId) {
    return res.status(400).json({ error: "Missing token or messageId" });
  }

  try {
    const inboxMessages = await axios.get(
      `https://graph.microsoft.com/v1.0/me/mailfolders/inbox/messages`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const messages = inboxMessages.data.value || [];

    for (const msg of messages) {
      const msgDetail = await axios.get(
        `https://graph.microsoft.com/v1.0/me/messages/${msg.id}?$select=internetMessageHeaders,subject`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const headers = msgDetail.data.internetMessageHeaders || [];
      const inReplyTo = headers.find(
        (h) => h.name.toLowerCase() === "in-reply-to"
      )?.value;
      const references = headers.find(
        (h) => h.name.toLowerCase() === "references"
      )?.value;

      if (
        inReplyTo === messageId ||
        (references && references.includes(messageId))
      ) {
        console.log(`✅ Reply found to message: ${msgDetail.data.subject}`);
        return true;
      }
    }

    return { success: false };
  } catch (err) {
    return { success: false, status: err.status };
  }
};

export const checksmtpreplied = async (user, pass, targetMessageId) => {
  if (!targetMessageId) {
    return res.status(400).json({ error: "Missing message_id in request" });
  }

  const imap = new Imap({
    user: user,
    password: pass, // App Password (use .env in production)
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });

  const checkReply = () =>
    new Promise((resolve, reject) => {
      let foundReply = false;
      let scannedCount = 0;
      const parsePromises = []; // ✅ Track parsing promises

      imap.once("ready", () => {
        console.log("📡 IMAP connection ready");

        imap.openBox("INBOX", true, (err, box) => {
          if (err) {
            console.error("❌ Failed to open inbox:", err);
            return reject(err);
          }

          // Fetch all messages
          const f = imap.seq.fetch("1:*", {
            bodies: [
              "HEADER.FIELDS (IN-REPLY-TO REFERENCES SUBJECT FROM DATE)",
            ],
          });

          f.on("message", (msg, seqno) => {
            msg.on("body", (stream) => {
              const parserPromise = new Promise((resolveParser) => {
                simpleParser(stream, (err, parsed) => {
                  if (err) {
                    console.error(
                      `❌ Error parsing message #${seqno}:`,
                      err.message
                    );
                    return resolveParser(); // Don't block other messages
                  }

                  scannedCount++;

                  const inReplyTo = parsed.headers.get("in-reply-to");
                  const references = parsed.headers.get("references");
                  const subject = parsed.subject;

                  if (inReplyTo?.trim() == targetMessageId.trim()) {
                    foundReply = true;
                  }

                  resolveParser();
                });
              });

              parsePromises.push(parserPromise);
            });
          });

          f.once("error", (err) => {
            console.error("❌ Fetch error:", err);
            reject(err);
          });

          f.once("end", async () => {
            await Promise.all(parsePromises); // ✅ Wait for all parser callbacks
            imap.end();
            resolve(foundReply);
          });
        });
      });

      imap.once("error", (err) => {
        console.error("❌ IMAP connection error:", err);
        reject(err);
      });

      imap.once("end", () => {
        console.log("📴 IMAP connection closed");
      });

      imap.connect(); // 🔌 Connect to IMAP server
    });

  try {
    const replied = await checkReply();

    if (replied) {
      return true;
    } else {
      return { success: false, message: "❌ No reply yet." };
    }
  } catch (error) {
    console.error("❌ IMAP Error:", error);
    return { success: false, status: error.status };
  }
};

export const sendemail = async (req, res) => {
  const { token, provider } = req.body;

  let recipientEmail = "sanjubora84@gmail.com";
  try {
    if (provider === "google") {
      let send = await axios.post();
      await sendViaGmail(token, recipientEmail);
    }
    if (provider === "microsoft") {
      recipientEmail = "sanjay.impactmindz@gmail.com";
      // await sendViaMicrosoft(token,recipientEmail)
    }
    res.json({ success: true, message: "Emails sent successfully" });
  } catch (err) {
    console.log(err);
  }
};

export const refreshGmailToken = async (refreshToken) => {
  try {
    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      qs.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, expires_in } = response.data;

    return access_token;
  } catch (err) {
    console.error(
      "❌ Failed to refresh Gmail token:",
      err.response?.data || err.message
    );
    return null;
  }
};

export const refreshMicrosoftToken = async (refreshToken) => {
  try {
    const response = await axios.post(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      qs.stringify({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: [
          "openid",
          "profile",
          "offline_access",
          "email",
          "https://graph.microsoft.com/Mail.Send",
          "https://graph.microsoft.com/Mail.ReadWrite",
          "https://graph.microsoft.com/MailboxSettings.ReadWrite",
        ].join(" "),
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, expires_in } = response.data;

    return access_token;
  } catch (err) {
    console.error(
      "❌ Failed to refresh Microsoft token:",
      err.response?.data || err.message
    );
    return null;
  }
};

export const checkAllReplies = async (cid, uid,delay) => {
 
  const currentUsers = JSON.parse(fs.readFileSync(currentUserFile, "utf-8"));
  const currentCampaigns = JSON.parse(fs.readFileSync(currentcompain, "utf-8"));
  const tokens = JSON.parse(fs.readFileSync(tokensFile, "utf-8"));

  // ✅ Get all active users
  const activeUsers = currentUsers.filter(
    (user) => user.active === true && user.user_id == uid
  );
  const activeCampaigns = currentCampaigns.filter(
    (c) => c.active === true && c.cid == cid
  );

  if (activeCampaigns.length === 0) {
    console.error("❌ No active campaigns found.");
    return { success: false };
  }

  for (const user of activeUsers) {
    const userEntry = tokens.find((t) => t.user_id === user.user_id);
    if (!userEntry) {
      console.warn(`⚠️ Token not found for user ID: ${user.user_id}`);
      continue;
    }

    const utoken = userEntry.token;

    for (const campaign of activeCampaigns) {
      const campaignId = campaign.cid;

      let leadsToCheck;
      try {
        const response = await axios.get(
          `${process.env.BASE_URL}/api/email-leads/unreplied/${campaignId}`,
          {
            headers: {
              Authorization: `Bearer ${utoken}`,
              "Content-Type": "application/json",
            },
          }
        );

        leadsToCheck = response.data.data;
      } catch (err) {
        console.error(
          `❌ Failed to fetch leads for campaign ${campaignId} & user ${user.user_id}:`,
          err.message
        );
        continue;
      }

      for (const lead of leadsToCheck) {
        let isReplied = false;

        try {
          if (lead.source === "gmail") {
            isReplied = await checkemailreplied(lead.token, lead.msgid);

            if (isReplied.success === false && isReplied.status === 401) {
              const newToken = await refreshGmailToken(lead.refreshtoken);

              if (newToken) {
                isReplied = await checkemailreplied(newToken, lead.msgid);
              }
            }
          } else if (lead.source === "outlook") {
            isReplied = await checkoutlookreplied(lead.token, lead.msgid);

            if (isReplied.success === false && isReplied.status === 401) {
              let refresh = await refreshMicrosoftToken(lead.refreshtoken);
              if (refresh) {
                isReplied = await checkoutlookreplied(refresh, lead.msgid);
              }
            }
          } else if (lead.source === "smtp") {
            isReplied = await checksmtpreplied(
              lead.user,
              lead.pass,
              lead.msgid
            );
          }

          if (isReplied === true) {
            await axios.patch(
              `${process.env.BASE_URL}/api/email-leads/${lead.id}/replied`,
              {
                replied: true,
              },
              {
                headers: {
                  Authorization: `Bearer ${utoken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            console.log(`✅ Updated: ${lead.email}`);
          } else {
            console.log(`❌ Not replied: ${lead.email}`);
            const sentAt = new Date(lead.updated_at);
            const now = new Date();
          
            const hoursSinceSent = (now - sentAt) / (1000 * 60 * 60);
            const delayInDays = delay || 1;
            const delayInHours = delayInDays * 24;
            if (Math.floor(hoursSinceSent) === delayInHours) {
              if (lead.source == "gmail") {
                const tokens = JSON.parse(fs.readFileSync(tokensFile, "utf-8"));

                let usertoken = tokens.filter(
                  (item) => item.user_id == lead?.user_id
                );
                let utoken = usertoken[0].token;
                let accesstoken = await axios.post(
                  `${process.env.BASE_URL}/api/email-token/access-token`,
                  {
                    email_id: lead?.user_email,
                    provider: "gmail",
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${usertoken[0].token}`,
                      "Content-Type": "application/json",
                    },
                  }
                );
                const { data } = accesstoken;
                let msgtoken = data?.access_token;

                let msgid = await sendViaGmail(
                  msgtoken,
                  lead.email,
                  utoken,
                  lead.name
                );

                if (msgid) {
                  let response = await axios.patch(
                    `${process.env.BASE_URL}/api/leads/update-msgid`,
                    { uid: lead?.uid, msgid: msgid },
                    {
                      headers: {
                        Authorization: `Bearer ${utoken}`,
                        "Content-Type": "application/json",
                      },
                    }
                  );
                }

                if (msgid?.success === false && msgid?.status == 401) {
                  let newtoken = await refreshGmailToken(lead?.refreshtoken);

                  if (newtoken) {
                    msgid = await sendViaGmail(
                      newtoken,
                     lead.email,
                      utoken,
                      lead?.name
                    );

                    let response = await axios.patch(
                      `${process.env.BASE_URL}/api/leads/update-msgid`,
                      { uid: lead?.uid, msgid: msgid },
                      {
                        headers: {
                          Authorization: `Bearer ${utoken}`,
                          "Content-Type": "application/json",
                        },
                      }
                    );
                  }
                }
              }

              if (lead.source == "outlook") {
                const tokens = JSON.parse(fs.readFileSync(tokensFile, "utf-8"));

                let usertoken = tokens.filter(
                  (item) => item.user_id == lead?.user_id
                );
                let utoken = usertoken[0].token;
                let accesstoken = await axios.post(
                  `${process.env.BASE_URL}/api/email-token/access-token`,
                  {
                    email_id: lead?.user_email,
                    provider: "outlook",
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${usertoken[0].token}`,
                      "Content-Type": "application/json",
                    },
                  }
                );
                const { data } = accesstoken;

                let msgtoken = data?.access_token;

                let msgid = await sendViaMicrosoft(
                  msgtoken,
                 lead.email,
                  utoken,
                  lead.name
                );

                if (msgid?.success === false && msgid?.status == 401) {
                  console.log(lead?.refreshtoken);
                  let newtoken = await refreshMicrosoftToken(
                    lead?.refreshtoken
                  );
                  console.log(newtoken);

                  if (newtoken) {
                    msgid = await sendViaMicrosoft(
                      newtoken,
                      "sanjubora84@gmail.com",
                      utoken,
                      lead?.name
                    );

                    let response = await axios.patch(
                      `${process.env.BASE_URL}/api/leads/update-msgid`,
                      { uid: lead?.uid, msgid: msgid },
                      {
                        headers: {
                          Authorization: `Bearer ${utoken}`,
                          "Content-Type": "application/json",
                        },
                      }
                    );
                  }
                } else {
                  let response = await axios.patch(
                    `${process.env.BASE_URL}/api/leads/update-msgid`,
                    { uid: lead?.uid, msgid: msgid },
                    {
                      headers: {
                        Authorization: `Bearer ${utoken}`,
                        "Content-Type": "application/json",
                      },
                    }
                  );
                }
              }
              if (lead.source == "smtp") {
                const tokens = JSON.parse(fs.readFileSync(tokensFile, "utf-8"));

                let usertoken = tokens.filter(
                  (item) => item.user_id == lead?.user_id
                );
                let utoken = usertoken[0].token;
                const { user, pass } = lead;

                let msgid = await sendemailSMTP(
                  user,
                  pass,
                  lead.email,
                  utoken,
                  lead.name
                );

                let response = await axios.patch(
                  `${process.env.BASE_URL}/api/leads/update-msgid`,
                  { uid: lead?.uid, msgid: msgid },
                  {
                    headers: {
                      Authorization: `Bearer ${utoken}`,
                      "Content-Type": "application/json",
                    },
                  }
                );
              }
            }
          }
        } catch (err) {
          console.error(
            `❌ Error checking reply for ${lead.email}:`,
            err.message
          );
        }
      }
    }
  }

  return { success: true };
};

// cron.schedule("0 9-17 * * *", async () => {
//   const statcron = JSON.parse(fs.readFileSync(start, "utf-8"));
//   const allUsers = JSON.parse(fs.readFileSync(currentUserFile, "utf-8"));

//   // Map all user processes into an array of Promises
//   const userTasks = allUsers.map(async (user) => {
//     const userCampaigns = statcron.filter(
//       (item) => item.start === true && item.uid == user.user_id
//     );

//     if (userCampaigns.length === 0) {
//       console.log(`⛔ No active campaigns for User ${user.user_id}`);
//       return;
//     }

//     console.log(`👤 Running campaigns for User ${user.user_id}`);

//     for (const campaign of userCampaigns) {
//       console.log(
//         `✅ Running Campaign ID ${campaign.cid} for User ${user.user_id}`
//       );

//       // You can also set context in-memory or use dynamic state per user if needed
//       await checkAllReplies(campaign.cid, user.user_id); // Make sure this works properly in parallel
//     }
//   });

//   // Run all user tasks in parallel
//   await Promise.all(userTasks);
// });

cron.schedule("0 9-17 * * *", async () => {
  const statcron = JSON.parse(fs.readFileSync(start, "utf-8"));
  const allUsers = JSON.parse(fs.readFileSync(currentUserFile, "utf-8"));

  // Map all user processes into an array of Promises
  const userTasks = allUsers.map(async (user) => {
    const userCampaigns = statcron.filter(
      (item) => item.start === true && item.uid == user.user_id
    );

    if (userCampaigns.length === 0) {
      console.log(`⛔ No active campaigns for User ${user.user_id}`);
      return;
    }

    console.log(`👤 Running campaigns for User ${user.user_id}`);

    for (const campaign of userCampaigns) {
      console.log(
        `✅ Running Campaign ID ${campaign.cid} for User ${user.user_id}`
      );

      // You can also set context in-memory or use dynamic state per user if needed
      await checkAllReplies(campaign.cid, user.user_id,campaign.delay); // Make sure this works properly in parallel
    }
  });

  // Run all user tasks in parallel
  await Promise.all(userTasks);
});


if (!isMainThread) {
  (async () => {
    const statcron = JSON.parse(fs.readFileSync(start, "utf-8"));
    const allUsers = JSON.parse(fs.readFileSync(currentUserFile, "utf-8"));
    const tokens = JSON.parse(fs.readFileSync(tokensFile, "utf-8"));

    const userTasks = allUsers.map(async (user) => {
      const userCampaigns = statcron.filter(
        (item) => item.start === true && item.uid == user.user_id
      );

      if (userCampaigns.length === 0) {
        console.log(`⛔ No active campaigns for User ${user.user_id}`);
        return;
      }

      const userToken = tokens.find((t) => t.user_id === user.user_id);
      if (!userToken) {
        console.warn(`⚠️ No token found for User ${user.user_id}`);
        return;
      }

      for (const campaign of userCampaigns) {
        console.log(
          `✅ Running Campaign ID ${campaign.cid} for User ${user.user_id}`
        );
        await checkAllReplies(campaign.cid, user.user_id);
      }
    });

    await Promise.all(userTasks);
    parentPort?.postMessage("done");
  })();
}
export const stopcompain = async (req, res) => {
  const { id } = req.body;

  try {
    const content = JSON.parse(fs.readFileSync(start, "utf-8"));
    const stopcron = content.find((item) => item.cid === id);
    stopcron.start = false;

    // Step 3: Write the updated object back to the file
    fs.writeFileSync(start, JSON.stringify(content, null, 2));
    return res.json({ message: "Compain has been stopped", isSuccess: true });
  } catch (err) {
    console.log(err);
  }
};

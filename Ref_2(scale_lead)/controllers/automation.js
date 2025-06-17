import fs from "fs";
import puppeteer from "puppeteer";
import cron from "node-cron";
import { fileURLToPath } from "url";
import axios from "axios";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FOLLOW_UP_MESSAGES = ["Just checking in 🙂"];


async function loadLeads(token) {
  try {
    const response = await axios.get(
      "https://impactmindz.in/client/scaleleads/api/linkedin/leads",
      {
        headers: {
          Authorization: `Bearer ${token}`, // Replace if required
        },
      }
    );
    return response.data.leads || []; // assuming leads are inside `leads` key
  } catch (err) {
    console.error("❌ Failed to fetch leads from API:", err.message);
    return [];
  }
}

function randomDelay(min = 30000, max = 90000) {
  return new Promise((res) =>
    setTimeout(res, Math.floor(Math.random() * (max - min + 1)) + min)
  );
}

async function sendLinkedInMessage(page, profileUrl, message) {
  try {
    await page.goto(profileUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('button[aria-label^="Message"]', {
      timeout: 10000,
    });
    await page.click('button[aria-label^="Message"]');
    await page.waitForSelector("div.msg-form__contenteditable", {
      timeout: 10000,
    });
    await page.type("div.msg-form__contenteditable", message, { delay: 50 });
    await page.click("button.msg-form__send-button");
    console.log(`✅ Message sent to ${profileUrl}`);
  } catch (err) {
    console.error(`❌ Failed to send message to ${profileUrl}`, err);
  }
}

export const runjob = async (req,res) => {
  // get the token
  let token = req.token;
// get the user id;
  const {sub} = req.user;
 let li_at_token = "";

  // fetch the cookies 
  try{
       const tokenRes = await axios.get(`https://impactmindz.in/client/scaleleads/api/linkedin-token/${sub}`,{
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
    const {data} = tokenRes;
 
     li_at_token = data?.data?.linkedin_token;
     console.log(li_at_token);
    
     if (!li_at_token) throw new Error("Missing li_at token");
  }catch(err){
    console.log(err);
  }

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
   await page.setCookie({
      name: "li_at",
      value: li_at_token,
      domain: ".linkedin.com",
      path: "/",
      httpOnly: true,
      secure: true,
    });

  await page.goto("https://www.linkedin.com/feed/", {
    waitUntil: "domcontentloaded",
  });
 
  let leads = await loadLeads(token);


  const now = new Date();

  // 1. Update connections (detect newly accepted requests)

  await page.goto(
    "https://www.linkedin.com/mynetwork/invite-connect/connections/",
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForSelector(".mn-connection-card__details", {
    timeout: 15000,
  });

  const connected = await page.evaluate(() => {
    const data = [];
    const cards = document.querySelectorAll(".mn-connection-card");

    cards.forEach((card) => {
      const nameEl = card.querySelector(".mn-connection-card__name");
      const timeEl = card.querySelector(".time-badge");
      const anchor = card.querySelector("a.mn-connection-card__link");

      const name = nameEl?.innerText?.trim();
      const profileUrl = anchor?.href?.split("?")[0] || "";
      const time = timeEl?.innerText?.trim();

      if (name && profileUrl && time) {
        data.push({ name, profileUrl, time });
      }
    });

    return data;
  });

  let updated = 0;
  for (let lead of leads) {
    const match = connected.find(
      (conn) => conn.name === lead.name || conn.profileUrl === lead.url
    );

    if (match) {
      lead.connectedAt = new Date().toISOString();
      updated++;
      console.log(`✅ Marked connected: ${lead.name}`);
    }
  }


  for (const lead of leads) {
    const match = connected.find(
      (conn) => conn.name === lead.name || conn.profileUrl === lead.url
    );
    if (match) {
      try {
        // Use the DOM to find and click the "Message" button for this connection
        await page.evaluate((name) => {
          const cards = document.querySelectorAll(".mn-connection-card");
          for (const card of cards) {
            const nameEl = card.querySelector(".mn-connection-card__name");
            if (nameEl && nameEl.innerText.trim() === name) {
              const messageBtn = card.querySelector(
                'button[aria-label^="Send a message"]'
              );
              if (messageBtn) {
                messageBtn.click();
                break;
              }
            }
          }
        }, lead.name);

        await page.waitForSelector("div.msg-form__contenteditable", {
          timeout: 10000,
        });
        await page.type(
          "div.msg-form__contenteditable",
          "Hey there! Glad to connect 🙂",
          { delay: 50 }
        );
        await page.waitForSelector("button.msg-form__send-button", {
          timeout: 5000,
        });
        await page.click("button.msg-form__send-button");
        console.log(`✅ Message sent to ${lead.name}`);
        lead.firstMessageSent = true;
        await randomDelay();
      } catch (err) {
        console.error(`❌ Failed to message ${lead.name}:`, err.message);
      }
    }
  }

  await browser.close();
};

// cron.schedule("* * * * *", () => {
//   console.log("🕐 Running LinkedIn automation job every 1 minutes...");
//   run();
// });

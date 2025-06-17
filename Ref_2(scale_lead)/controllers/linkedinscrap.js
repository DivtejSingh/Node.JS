import fs from "fs";
import puppeteer from "puppeteer-extra";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import 'dotenv/config'
import cron from "node-cron";
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const sessionId = `linkedin_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

const linkedintokensFile = path.join(__dirname, "linkedin_tokens.json");
const linkedincurrentUserFile = path.join(__dirname, "linkedin_current_users.json");

const linkedinstart = path.join(__dirname, "linkedin_start.json");
const linkedincurrentcompain = path.join(__dirname, "linkedin_campaigns.json");

const simulateHumanBehavior = async (page) => {

  const viewport = await page.viewport();
  // Mouse movement simulation
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(Math.random() * viewport.width);
    const y = Math.floor(Math.random() * viewport.height);
    await page.mouse.move(x, y, { steps: 5 });
     await new Promise(r => setTimeout(r, 1500));
  }

  // Scroll slowly
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, 200));
    await new Promise(r => setTimeout(r, 1500));
  }
};



// random delay
const randomDelay = (min=4000, max=15000) =>
  new Promise(res => setTimeout(res, Math.floor(Math.random() * (max - min + 1) + min)));



const simulateMouseMove = async (page) => {
  const width = await page.evaluate(() => window.innerWidth);
  const height = await page.evaluate(() => window.innerHeight);
  await page.mouse.move(
    Math.floor(Math.random() * width),
    Math.floor(Math.random() * height)
  );
};




export const linkedinscrap = async (req, res) => {
  const {body} = req.body;
  const{id,company_size,sector,usertoken} = body;
  const myCookies = req.cookies;

  const{sub} = req.user;
  const token = req.token;



  // 1. 🔐 Fetch li_at token from your backend API
  let li_at_token = usertoken;
// add some data before scrapping 


let currentUsers = [];
if (fs.existsSync(linkedincurrentUserFile)) {
  currentUsers = JSON.parse(fs.readFileSync(linkedincurrentUserFile, "utf-8"));
}
if (!currentUsers.find(u => u.user_id == sub)) {
  currentUsers.push({ user_id: sub, active: true });
  fs.writeFileSync(linkedincurrentUserFile, JSON.stringify(currentUsers, null, 2));
}


//add linkedincompain
let campaigns = [];
if (fs.existsSync(linkedincurrentcompain)) {
  campaigns = JSON.parse(fs.readFileSync(linkedincurrentcompain, "utf-8"));
}
if (!campaigns.find(c => c.cid == id)) {
  campaigns.push({ cid: id, uid: sub, active: true });
  fs.writeFileSync(linkedincurrentcompain, JSON.stringify(campaigns, null, 2));
}

// add token 


let tokens = [];
if (fs.existsSync(linkedintokensFile)) {
  tokens = JSON.parse(fs.readFileSync(linkedintokensFile, "utf-8"));
}

// Check if user already exists
const existingIndex = tokens.findIndex(t => t.user_id == sub);

if (existingIndex !== -1) {
  // ✅ Update existing token entry
  tokens[existingIndex].token = token;
  tokens[existingIndex].linkedintoken = usertoken;
} else {
  // ✅ Add new token entry
  tokens.push({
    user_id: sub,
    token: token,
    linkedintoken: usertoken
  });
}

// ✅ Write updated array back to file
fs.writeFileSync(linkedintokensFile, JSON.stringify(tokens, null, 2));


//start flag
let startEntries = [];
if (fs.existsSync(linkedinstart)) {
  startEntries = JSON.parse(fs.readFileSync(linkedinstart, "utf-8"));
}

const existingEntryIndex = startEntries.findIndex(e => e.uid == sub && e.cid == id);

if (existingEntryIndex === -1) {
  // If entry does not exist, add a new one
  startEntries.push({ uid: sub, cid: id, start: true });
} else {
  // If entry exists, update start to true
  startEntries[existingEntryIndex].start = true;
}

fs.writeFileSync(linkedinstart, JSON.stringify(startEntries, null, 2));


  try {
    
    if (!li_at_token) throw new Error("Missing li_at token");
  } catch (err) {
    console.error("❌ Failed to fetch li_at token:", err.message);
    return res.status(500).send("Failed to fetch LinkedIn cookie");
  }

  // 2. 🔍 Fetch additional company info
  let leads = [];
  let company_sizes = company_size;
  let company = sector;


  let browser;
  try {




     browser = await puppeteer.connect({
      browserWSEndpoint: BROWSER_WS,
     args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });


  
    // browser = await puppeteer.launch({
    //   headless:false,
    //   slowMo:50,
    //   defaultViewport: null,
    //   args: ['--no-sandbox', '--disable-setuid-sandbox'],
      
    // });

    const page = await browser.newPage();





      await page.setViewport({ width: 1280, height: 1020 });
    // Set li_at cookie before loading any LinkedIn page
  await page.goto('https://www.linkedin.com', { waitUntil: 'domcontentloaded' });



   
//set cookies

await page.evaluate((liAtToken) => {
  document.cookie = `li_at=${liAtToken}; domain=.linkedin.com; path=/; secure; SameSite=None`;
}, usertoken);

await page.evaluate(() => location.href = "https://www.linkedin.com/feed");
await page.waitForNavigation({ waitUntil: "domcontentloaded" });

    // 4. 🔗 Open LinkedIn and validate login
await simulateHumanBehavior(page);





await new Promise(r => setTimeout(r, 1500));

await page.waitForSelector('input[placeholder="Search"]', { timeout: 10000 });
const searchInputSelector = 'input[placeholder="Search"]';
await page.click(searchInputSelector);
await page.focus(searchInputSelector);
for (const char of company) {
  await page.keyboard.type(char);
  await new Promise(r => setTimeout(r, 150)); // Human-like delay
}
await page.keyboard.press('Enter');


    // 5. 🔎 Go to search results
    const searchUrl = `https://www.linkedin.com/search/results/people/?companySize=${company_sizes}&keywords=${encodeURIComponent(company)}`;
    await page.evaluate(url => window.location.href = url, searchUrl);
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

await simulateHumanBehavior(page);

    let currentPage = 1;
    const maxPages = 2;

    while (currentPage < maxPages) {



      await page.waitForSelector('ul[role="list"] > li', { timeout: 25000 });
     
      const scrapedProfiles = await page.evaluate(() => {
        const results = [];
        const cards = document.querySelectorAll('ul[role="list"] > li');
        cards.forEach((card) => {
         card.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
});

        cards.forEach((card) => {
          const getText = (selector, root = card) =>
            root.querySelector(selector)?.innerText.trim() || "";
          const mb1Divs = card.querySelectorAll(".mb1 > div");
          const count = mb1Divs.length;
          const Education = mb1Divs[count - 2]?.innerText?.trim() || "";
          const location = mb1Divs[count - 1]?.innerText?.trim() || "";
          const name = getText('span[aria-hidden="true"]');
          const headline = Education;
          const mutual = getText(".entity-result__insights");
          const profileLink = card.querySelector('a[href*="/in/"]')?.href?.split("?")[0] || "";

          results.push({ name, headline, location, Education, mutualConnections: mutual, profileUrl: profileLink });
        });
        return results.slice(0, 25);
      });

      scrapedProfiles.forEach((profile) => {
        if (profile.name && profile.profileUrl) {
          leads.push({
            name: profile.name,
            url: profile.profileUrl,
            headline: profile.headline,
            location: profile.location,
            connectedAt: new Date().toISOString(),
            connectionRequest: true,
            firstMessageSent: false,
            replied: false,
            token:usertoken
          });
        }
      });

      await simulateHumanBehavior(page);
      // 🚀 Try to connect with people
    await page.evaluate(async () => {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const connectButtons = [...document.querySelectorAll('button[aria-label*="to connect"]')];
        for (let i = 0; i < connectButtons.length; i++) {
          try {
            connectButtons[i].click();
            await delay(2000);
            const addNoteBtn = document.querySelector('button[aria-label="Send without a note"]');
           
          if(addNoteBtn){
              addNoteBtn.click();
              await delay(1000);
          }
          } catch (e) {
            console.warn(`❌ Failed at index ${i}`, e);
          }
        }
      });



      const nextBtn = await page.$('button[aria-label="Next"]');
      if (!nextBtn) break;

      await Promise.all([nextBtn.click(), page.waitForNavigation({ waitUntil: "domcontentloaded" })]);
      await new Promise((r) => setTimeout(r, 2000));
      currentPage++;
    }
    try {
  
      await axios.post(
        `${process.env.BASE_URL}/api/linkedin/leads`,
        {
        campaign_id: id,
          scraped: leads,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.log(err);
    }
    await browser.close();
    return res.status(200).json({ status: true, scraped: leads, message: "✅ Scraping and connections done!" });
  } catch (err) {
    console.error("❌ Scraper failed:", err.message);
    if (browser) await browser.close();
    return res.status(500).send("Error: " + err.message);
  }
};



export const linkedinid = async (req, res) => {
  const { user_token } = req.body; // li_at

  let browser;
  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: BROWSER_WS,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    //  browser = await puppeteer.launch({
    //   headless:false,
    //   slowMo:50,
    //   defaultViewport: null,
    //   args: ['--no-sandbox', '--disable-setuid-sandbox'],
      
    // });

    const page = await browser.newPage();
    // await page.setUserAgent(
    //   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36'
    // );

      await page.setViewport({ width: 1280, height: 1020 });
    // Set li_at cookie before loading any LinkedIn page
  await page.goto('https://www.linkedin.com', { waitUntil: 'domcontentloaded' });

    // Inject li_at via JS (not setCookie)
    await page.evaluate((token) => {
      document.cookie = `li_at=${token}; domain=.linkedin.com; path=/; secure; SameSite=Lax`;
    }, user_token);

    await page.goto('https://www.linkedin.com/feed', {
      waitUntil: 'domcontentloaded',
    });
      await simulateHumanBehavior(page);

    // Verify login
    if (await page.$('input[name="session_key"]')) {
      throw new Error('Invalid li_at token – login page loaded');
    }

    const profileName = await page.evaluate(() => {
  const el = document.querySelector('h3.profile-card-name.text-heading-large');
  return el ? el.innerText.trim() : null;
});

if (!profileName) throw new Error("Couldn't extract profile name");


    console.log('✅ Logged into LinkedIn successfully');

    // Fetch profile + email from internal API using browser context


    await browser.close();

    return res.status(200).json({
      status: true,
   
         name: profileName,
   
    });
  } catch (err) {
    if (browser) await browser.close();
    console.error('❌ Error:', err.message);
    return res.status(500).json({ status: false, error: err.message });
  }
};







export const linkedinFollowupJob = async (cid, uid) => {
  try {
    const currentUsers = JSON.parse(fs.readFileSync(linkedincurrentUserFile, 'utf-8'));
    const currentCampaigns = JSON.parse(fs.readFileSync(linkedincurrentcompain, 'utf-8'));
    const tokens = JSON.parse(fs.readFileSync(linkedintokensFile, 'utf-8'));

    const user = currentUsers.find(u => u.user_id === uid && u.active);
    const campaign = currentCampaigns.find(c => c.cid === cid && c.active);

    if (!user || !campaign) return console.log(`⛔ No active user/campaign for uid: ${uid} cid: ${cid}`);
  

    const tokenEntry = tokens.find(t => t.user_id === uid);
    const linkedintoken = tokenEntry?.linkedintoken;
    const usertoken = tokenEntry?.token;
 
   const browser = await puppeteer.connect({ browserWSEndpoint: BROWSER_WS , args: ['--no-sandbox', '--disable-setuid-sandbox']});
  // let  browser = await puppeteer.launch({
  //     headless:false,
  //     slowMo:50,
  //     defaultViewport: null,
  //     args: ['--no-sandbox', '--disable-setuid-sandbox'],
      
  //   });
    const page = await browser.newPage();


      await page.setViewport({ width: 1280, height: 1020 });

    await page.goto('https://www.linkedin.com', { waitUntil: 'domcontentloaded' });


    await page.evaluate((liAt) => {
      document.cookie = `li_at=${liAt}; domain=.linkedin.com; path=/; secure; SameSite=None`;
    }, linkedintoken);

    await page.goto('https://www.linkedin.com/feed', { waitUntil: 'domcontentloaded' });
     await simulateHumanBehavior(page);
await page.evaluate(() => location.href = "https://www.linkedin.com/mynetwork/invite-connect/connections/");
await page.waitForNavigation({ waitUntil: "domcontentloaded" });

     await simulateHumanBehavior(page);

await page.waitForSelector(".mn-connection-card__details", { timeout: 45000 });
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



    const leadsRes = await axios.get(`${process.env.BASE_URL}/api/linkedin/leads/unreplied?campaign_id=${cid}`, {
      headers: {
        Authorization: `Bearer ${usertoken}`
      }
    });

    const {data} = leadsRes;

   const leads = data?.leads;
for (const lead of leads) {
  const match = connected.find(c => c.profileUrl === lead.url || c.name === lead.name);

  if (match) {
    const connectedAt = new Date(lead.created_at);
    const now = new Date();
    const hoursSinceConnection = (now - connectedAt) / (1000 * 60 * 60);
  
    if (hoursSinceConnection >= 1 && !lead.first_message_sent) {
      try {
       
        await Promise.all([
  page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
  page.evaluate(url => location.href = url, lead.url)
]);

        const firstName = lead.name.trim().split(" ")[0];
    
        const selector = `button[aria-label="Message ${firstName}"]`;
        
        await new Promise(r => setTimeout(r, 1500));

      await page.waitForSelector(selector, { timeout: 25000 });
      
await page.evaluate((sel) => {
  const btn = document.querySelector(sel);
  if (btn) {
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    btn.click();
  }
}, selector);


// extract the current user token 

let messagetemplate = await axios.get(
    `${process.env.BASE_URL}/api/user/messages/latest`,
    {
      headers: {
        Authorization: `Bearer ${usertoken}`,
        "Content-Type": "application/json",
      },
    }
  );
  const { data } = messagetemplate;
 let content = data?.data.message_content;
  let editcontent = content.replace("[Director's Name]", `${lead.name}`);

        await page.waitForSelector('div.msg-form__contenteditable', { timeout: 35000 });
        await page.type('div.msg-form__contenteditable', editcontent, { delay: 300 });

          await new Promise(r => setTimeout(r, 1500));
  
        await page.click('button.msg-form__send-button');

 
  // update the id 
try {
  const response = await axios.post(
    `${process.env.BASE_URL}/api/linkedin/leads/update-first-message`,
    {
      id: lead.id,
      first_message_sent: true,
    },
    {
      headers: {
        Authorization: `Bearer ${usertoken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  
} catch (err) {
  console.error("❌ Axios Error:", err.response?.data || err.message);
}

  await new Promise(r => setTimeout(r, 1500));

        
      } catch (err) {
        console.error(`❌ Failed to message ${lead.name}:`, err.message);
      }
    } else {
      //here  make the condition to check if replied or not if not then after some delay again send the message
       if(lead.first_message_sent && !lead?.replied){
        console.log(`🔍 Checking reply status for ${lead.name}`);


        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded',timeout:5000 }),
          page.evaluate(url=>location.href= url,lead.url)
        ]);

        await new Promise(r=>setTimeout(r,2000));
       const firstName = lead.name.trim().split(" ")[0];
    
        const selector = `button[aria-label="Message ${firstName}"]`;
        
        await new Promise(r => setTimeout(r, 1500));

      await page.waitForSelector(selector, { timeout: 25000 });
      
await page.evaluate((sel) => {
  const btn = document.querySelector(sel);
  if (btn) {
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    btn.click();
  }
}, selector);



  await page.waitForSelector('li.msg-s-message-list__event.clearfix', { timeout: 5000 });
   const messages = await page.evaluate(() => {
  const messageElements = document.querySelectorAll('li.msg-s-message-list__event.clearfix');
  const data = [];

  messageElements.forEach(el => {
    const senderEl = el.querySelector('.msg-s-message-group__name');
    const messageEl = el.querySelector('.msg-s-event-listitem__body') || el.querySelector('.msg-s-message-list-content');

    const sender = senderEl ? senderEl.innerText.trim() : '';
    const message = messageEl ? messageEl.innerText.trim() : '';

    if (message) {
      data.push({ sender, message });
    }
  });

  return data;
});
  const replied = messages.some(msg => {
  return msg.sender== lead.name && msg.message.length > 0;
});


if (replied) {
    

        await axios.patch(`${process.env.BASE_URL}/api/linkedin/leads/update-replied`, {
          id: lead.id,
          replied: true
        }, {
          headers: {
            Authorization: `Bearer ${usertoken}`,
            'Content-Type': 'application/json'
          }
        });

      } else {
        console.log(`⏳ ${lead.name} has not replied yet.`);
      }
      }
       
      
    }
  } else {
    console.log(`⛔ Not yet connected: ${lead.name}`);
  }
}

await browser.close();
   

  } catch (err) {
    console.error(`❌ LinkedIn follow-up job failed for uid: ${uid} cid: ${cid}`, err.message);
  }
};


cron.schedule('0 9-17 * * *', async () => {
  const activeUsers = JSON.parse(fs.readFileSync(linkedincurrentUserFile, 'utf-8'));
  const activeStarts = JSON.parse(fs.readFileSync(linkedinstart, 'utf-8'));

  for (const user of activeUsers) {
    const userCampaigns = activeStarts.filter(item => item.start && item.uid === user.user_id);

    for (const campaign of userCampaigns) {
      console.log(`🚀 Running follow-up for UID ${user.user_id}, CID ${campaign.cid}`);
      await linkedinFollowupJob(campaign.cid, user.user_id);
    }
  }
});

export const linkedinstopcompain = async (req, res) => {
  const { id } = req.body;

  try {
    const content = JSON.parse(fs.readFileSync(linkedinstart, "utf-8"));
    const stopcron = content.find((item) => item.cid == id);

    stopcron.start = false;

    // Step 3: Write the updated object back to the file
    fs.writeFileSync(linkedinstart, JSON.stringify(content, null, 2));
    return res.json({ message: "Compain has been stopped", isSuccess: true });
  } catch (err) {
    console.log(err);
  }
};
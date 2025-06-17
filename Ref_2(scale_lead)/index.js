import express from 'express';
import puppeteer from 'puppeteer-extra';
import bodyParser from 'body-parser';
import path from 'path';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { apiRouter } from './routes/apirouter.js';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import Bree from 'bree';

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bree = new Bree({
 root: false,
  jobs:[
    {
      name:'check_replies',
      interval:'1m',
      path:path.join(__dirname,'controllers','emailscrap.js'),
      worker: {
        workerData: {},
       
        concurrent: true              
      }
    }
  ]
})
// update the cors origin
app.use(cors({
    origin: 'https://scale-leads-jet.vercel.app',
  credentials: true, // Allow cookies
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

puppeteer.use(StealthPlugin());


app.use('/api',apiRouter)



const PORT = process.env.PORT || 4000;
// bree.start();
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));

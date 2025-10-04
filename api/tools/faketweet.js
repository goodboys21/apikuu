/*
  Fake Tweet Generator API (Vercel Compatible)
  • Express Router
  • Puppeteer-Core + Chrome-AWS-Lambda
*/

const express = require("express");
const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

const router = express.Router();

// Fungsi untuk format angka (1000 -> 1K)
function numberFormatter(num) {
  if (num === null) return null;
  if (num === 0) return '0';
  const fixed = 0;
  const b = num.toPrecision(2).split('e');
  const k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3);
  const c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3)).toFixed(1 + fixed);
  const d = c < 0 ? c : Math.abs(c);
  const e = d + ['', 'K', 'M', 'B', 'T'][k];
  return e;
}

// Fungsi untuk membuat HTML tweet secara dinamis
function generateTweetHTML(params) {
  const {
    name,
    username,
    avatar,
    message,
    time,
    date,
    client,
    retweets,
    quotes,
    likes,
    theme,
    verified
  } = params;
  
  const themeClass = theme === 'dim' ? 'dim' : theme === 'dark' ? 'dark' : '';
  const isDark = theme === 'dim' || theme === 'dark';

  const verifiedBadge = verified === 'true' ? `
    <svg xmlns="http://www.w3.org/2000/svg" class="verified" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <g><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"></path></g>
    </svg>` : '';
    
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8" />
        <style>
            body { 
                margin: 0; 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .tweet {
                background-color: ${isDark ? (theme === 'dim' ? '#15202b' : '#000000') : '#ffffff'};
                color: ${isDark ? '#f7f9f9' : '#0f1419'};
                border: 1px solid ${isDark ? '#38444d' : '#cfd9de'};
                border-radius: 16px;
                max-width: 550px;
                padding: 1rem;
                display: inline-block;
            }
            .head { display: flex; justify-content: space-between; align-items: flex-start; }
            .title { display: flex; align-items: center; }
            .avatar { border-radius: 50%; margin-right: 12px; }
            .text p { margin: 0; }
            .name { font-weight: bold; }
            .username, .dots { color: #8899a6; }
            .verified { margin-left: 4px; vertical-align: text-bottom; fill: #1d9bf0; }
            .content .message { font-size: 1.1rem; line-height: 1.4; margin: 12px 0; white-space: pre-wrap; word-wrap: break-word; }
            .tweet_info { display: flex; color: #8899a6; font-size: 0.9rem; margin-bottom: 12px; }
            .stats { display: flex; gap: 20px; padding: 12px 0; border-top: 1px solid ${isDark ? '#38444d' : '#eff3f4'}; }
            .stat { color: #8899a6; }
            .stat .count { font-weight: bold; color: ${isDark ? '#f7f9f9' : '#0f1419'}; }
        </style>
    </head>
    <body>
        <div class="tweet ${themeClass}">
          <div class="head">
            <div class="title">
              <img class="avatar" src="${avatar}" alt="avatar" width="48" height="48"/>
              <div class="text">
                <p><span class="name">${name}</span>${verifiedBadge}</p>
                <p class="username">@${username}</p>
              </div>
            </div>
            <div class="dots">...</div>
          </div>
          <div class="content">
            <div class="message">${message}</div>
            <div class="tweet_info">
              <div>${time}</div>&nbsp;&middot;&nbsp;<div>${date}</div>&nbsp;&middot;&nbsp;<div>${client}</div>
            </div>
          </div>
          <div class="stats">
            <div class="stat"><span class="count">${numberFormatter(retweets)}</span> Retweets</div>
            <div class="stat"><span class="count">${numberFormatter(quotes)}</span> Quote Tweets</div>
            <div class="stat"><span class="count">${numberFormatter(likes)}</span> Likes</div>
          </div>
        </div>
    </body>
    </html>`;
}

router.get("/faketweet", async (req, res) => {
  const { 
    name = 'Lemon',
    username = 'Lemon',
    avatar = 'https://pbs.twimg.com/profile_images/1590968738358079488/IY9Gx6Ok_400x400.jpg',
    message = 'Lemon merupakan salah satu buah terbaik di dunia.',
    time = '8:12 PM',
    date = 'Oct 4, 2025',
    client = 'Twitter for iPhone',
    retweets = 1000,
    quotes = 1000,
    likes = 1000,
    theme = 'light',
    verified = 'false'
  } = req.query;

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    const htmlContent = generateTweetHTML({ name, username, avatar, message, time, date, client, retweets, quotes, likes, theme, verified });
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const tweetElement = await page.$('.tweet');
    if (!tweetElement) throw new Error("Elemen tweet tidak ditemukan.");

    const imageBuffer = await tweetElement.screenshot({
      omitBackground: true,
    });

    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);

  } catch (err) {
    console.error("Error Fake Tweet Generator:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

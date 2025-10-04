/*
  Fake Tweet Generator API (Vercel-Compatible)
  Menggunakan API Page2Images (bukan Puppeteer)
*/

const express = require("express");
const axios = require("axios");

const router = express.Router();

// format angka 1000 → 1K
function numberFormatter(num) {
  if (!num) return "0";
  if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toString();
}

// generate HTML tweet
function generateTweetHTML({
  name,
  username,
  avatar,
  message,
  time,
  date,
  client,
  retweets,
  quotes,
  likes
}) {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fake Tweet</title>
  <style>
    body {
      background-color: #e6ecf0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }

    .tweet {
      background-color: #ffffff;
      border: 1px solid #ccd6dd;
      border-radius: 16px;
      max-width: 550px;
      width: 100%;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .tweet .head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .tweet .title {
      display: flex;
      align-items: center;
    }
    .tweet #tweet_avatar {
      border-radius: 50%;
      margin-right: 12px;
    }
    .tweet .text p {
      margin: 0;
    }
    .tweet #tweet_name {
      font-weight: bold;
      color: #0f1419;
    }
    .tweet #tweet_username, .tweet .dots {
      color: #536471;
    }

    .tweet .content .message {
      font-size: 1.1rem;
      line-height: 1.4;
      color: #0f1419;
      margin: 12px 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .tweet .tweet_info {
      display: flex;
      color: #536471;
      font-size: 0.9rem;
      margin-bottom: 12px;
    }

    .tweet .stats {
      display: flex;
      gap: 20px;
      padding: 12px 0;
      border-top: 1px solid #eff3f4;
      border-bottom: 1px solid #eff3f4;
    }
    .tweet .stat {
      color: #536471;
    }
    .tweet .stat .count {
      font-weight: bold;
      color: #0f1419;
    }

    .tweet .tail {
      display: flex;
      justify-content: space-around;
      padding-top: 12px;
    }
    .tweet .tail svg {
      fill: #536471;
    }
  </style>
</head>
<body>
  <div id="tweet" class="tweet">
    <div class="head">
      <div class="title">
        <img id="tweet_avatar" src="${avatar}" width="48" height="48" />
        <div class="text">
          <p><span id="tweet_name">${name}</span></p>
          <p>@<span id="tweet_username">${username}</span></p>
        </div>
      </div>
      <div class="dots">
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><g><circle cx="5" cy="12" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle></g></svg>
      </div>
    </div>
    <div class="content">
      <div id="tweet_message" class="message">${message}</div>
      <div class="tweet_info">
        <div id="tweet_time">${time}</div>
        &nbsp;&centerdot;&nbsp;
        <div id="tweet_date">${date}</div>
        &nbsp;&centerdot;&nbsp;
        <div id="tweet_client">${client}</div>
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
    name = "Lemon",
    username = "Lemon",
    avatar = "https://pbs.twimg.com/profile_images/1590968738358079488/IY9Gx6Ok_400x400.jpg",
    message = "Lemon merupakan salah satu buah terbaik di dunia.",
    time = "8:12 PM",
    date = "Oct 4, 2025",
    client = "Twitter for iPhone",
    retweets = 1000,
    quotes = 1000,
    likes = 1000
  } = req.query;

  try {
    const html = generateTweetHTML({ name, username, avatar, message, time, date, client, retweets, quotes, likes });

    // kirim HTML ke Page2Images
    const form = new URLSearchParams({
      p2i_html: html,
      p2i_device: "2",
      p2i_size: "960x0",
      flag: "mobile_emulator",
      p2i_htmlerror: "1"
    });

    const { data } = await axios.post("https://www.page2images.com/api/html_to_image", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      timeout: 30000
    });

    if (!data.image_url) throw new Error("Gagal membuat gambar");

    res.json({
      success: true,
      image: data.image_url
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;

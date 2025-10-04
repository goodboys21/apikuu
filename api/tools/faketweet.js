/*
  Fake Tweet Generator API (Vercel-Compatible)
  Menggunakan API Page2Images (tanpa Puppeteer)
  Fitur: Emoji iPhone, Verified Badge, Dark Theme, Realtime Date-Time
*/

const express = require("express");
const axios = require("axios");
const router = express.Router();

// Format angka (1K, 1M, dst)
function numberFormatter(num) {
  if (!num) return "0";
  if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toString();
}

// Generate HTML Tweet
function generateTweetHTML({
  name,
  username,
  avatar,
  message,
  verified,
  theme,
  retweets,
  quotes,
  likes,
  time,
  date
}) {
  const isDark = theme === "dark";
  const bg = isDark ? "#000000" : "#ffffff";
  const text = isDark ? "#E7E9EA" : "#0f1419";
  const sub = isDark ? "#71767B" : "#536471";
  const border = isDark ? "#2f3336" : "#eff3f4";

  const verifiedBadge = verified === "true"
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#1D9BF0" viewBox="0 0 24 24" style="margin-left:4px;vertical-align:middle;"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.53.435.875z"/></svg>`
    : "";

  return `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Fake Tweet</title>
<style>
  body {
    background-color: ${bg};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    padding: 20px;
    color: ${text};
  }
  .tweet {
    background-color: ${bg};
    border: 1px solid ${border};
    border-radius: 16px;
    max-width: 550px;
    width: 100%;
    padding: 1rem;
  }
  .head {
    display: flex;
    justify-content: space-between;
  }
  .title {
    display: flex;
    align-items: center;
  }
  img.avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    margin-right: 12px;
  }
  .name {
    font-weight: 700;
    font-size: 16px;
  }
  .username {
    color: ${sub};
    font-size: 15px;
  }
  .message {
    margin: 12px 0;
    font-size: 18px;
    white-space: pre-wrap;
  }
  .info {
    color: ${sub};
    font-size: 14px;
    margin-bottom: 8px;
  }
  .stats {
    display: flex;
    gap: 20px;
    border-top: 1px solid ${border};
    border-bottom: 1px solid ${border};
    padding: 10px 0;
    color: ${sub};
    font-size: 14px;
  }
  .count {
    font-weight: 700;
    color: ${text};
  }
</style>
</head>
<body>
  <div class="tweet">
    <div class="head">
      <div class="title">
        <img class="avatar" src="${avatar}" />
        <div>
          <div class="name">${name}${verifiedBadge}</div>
          <div class="username">@${username}</div>
        </div>
      </div>
    </div>
    <div class="message">${message}</div>
    <div class="info">${time} · ${date} · Twitter for iPhone</div>
    <div class="stats">
      <div><span class="count">${numberFormatter(retweets)}</span> Retweets</div>
      <div><span class="count">${numberFormatter(quotes)}</span> Quote Tweets</div>
      <div><span class="count">${numberFormatter(likes)}</span> Likes</div>
    </div>
  </div>
</body>
</html>`;
}

// Route utama
router.get("/faketweet", async (req, res) => {
  try {
    const {
      name = "Bagus",
      username = "bagusbhrl",
      profile = "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
      message = "Halo semua! 🤭",
      theme = "dark",
      verified = "true",
      retweets = 123,
      quotes = 45,
      likes = 999,
    } = req.query;

    // waktu realtime WIB
    const now = new Date();
    const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
    const date = now.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta"
    });

    const html = generateTweetHTML({
      name,
      username,
      avatar: profile,
      message,
      verified,
      theme,
      retweets,
      quotes,
      likes,
      time,
      date
    });

    const form = new URLSearchParams({
      p2i_html: html,
      p2i_device: "6", // iPhone X
      p2i_size: "900x0",
      p2i_htmlerror: "1"
    });

    const { data } = await axios.post("https://www.page2images.com/api/html_to_image", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      timeout: 30000
    });

    if (!data.image_url) throw new Error("Gagal membuat gambar tweet");

    res.json({
      success: true,
      image: data.image_url
    });

  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;

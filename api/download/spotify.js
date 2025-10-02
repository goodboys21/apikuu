/*
• Spotify Downloader Scrape (fix)
• Source: spotidown.app
• Author: Bagus Bahril
*/

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

async function spotifyDownloader(spotifyUrl) {
  try {
    // step 1: request awal
    const { data: step1 } = await axios.post(
      "https://spotidown.app/action",
      new URLSearchParams({ url: spotifyUrl }),
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Referer: "https://spotidown.app/",
        },
      }
    );

    // load HTML ke cheerio
    const $ = cheerio.load(step1);

    // ambil data track (title, artist, cover)
    const title = $("h1[itemprop='name'] a").attr("title") || $("h3[itemprop='name'] div").attr("title") || "Unknown";
    const artist = $("p span").first().text() || "Unknown";
    const cover = $(".spotidown-left img").attr("src") || null;

    if (!title && !cover) throw new Error("Gagal parsing data awal (struktur HTML berubah)");

    // ambil semua input hidden form
    const formData = {};
    $("form[name='submitspurl'] input").each((i, el) => {
      const name = $(el).attr("name");
      const value = $(el).attr("value");
      if (name && value) formData[name] = value;
    });

    // step 2: request download link
    const { data: step2 } = await axios.post(
      "https://spotidown.app/action/track",
      new URLSearchParams(formData),
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Referer: "https://spotidown.app/",
        },
      }
    );

    const $$ = cheerio.load(step2);

    // cari link download mp3 dan cover
    const mp3 = $$("#popup[href*='rapid.spotidown.app']").first().attr("href") || null;
    const coverDl = $$("#popup:contains('Download Cover')").attr("href") || null;

    return {
      success: true,
      creator: "Bagus Bahril",
      title,
      artist,
      cover,
      download: {
        mp3,
        cover: coverDl,
      },
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

router.get("/spotify", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, message: "Masukkan parameter ?url=" });

  const result = await spotifyDownloader(url);
  res.json(result);
});

module.exports = router;

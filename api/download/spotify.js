/*
• Spotify Downloader Scrape
• Source: spotidown.app
• Author: Bagus Bahril
*/

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

async function spotifyDownloader(spotifyUrl) {
  try {
    // step 1: POST ke spotidown.app/action
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

    if (step1.error) throw new Error("Gagal parsing data awal");

    // parse HTML track info
    const $ = cheerio.load(step1.data);
    const title = $("h1[itemprop='name'] a").attr("title") || $("h3[itemprop='name'] div").attr("title");
    const artist = $("p span").first().text() || null;
    const cover = $(".spotidown-left img").attr("src") || null;

    // form hidden input untuk lanjut ke /action/track
    const formData = {};
    $("form[name='submitspurl'] input").each((i, el) => {
      const name = $(el).attr("name");
      const value = $(el).attr("value");
      if (name && value) formData[name] = value;
    });

    // step 2: POST ke spotidown.app/action/track
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

    if (step2.error) throw new Error("Gagal ambil link download");

    const $$ = cheerio.load(step2.data);

    // ambil link download mp3 & cover
    const mp3 = $$("#popup[href*='rapid.spotidown.app/v2?token=']").first().attr("href") || null;
    const coverDl = $$("#popup:contains('Download Cover')").attr("href") || null;

    return {
      success: true,
      creator: "Bagus Bahril",
      title: title || "Unknown",
      artist: artist || "Unknown",
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

/**
 * Instagram Scraper (Scrape Version)
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/instagram", async (req, res) => {
  const username = req.query.username?.trim();

  if (!username) {
    return res.status(400).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Username parameter is required",
    });
  }

  try {
    const url = `https://media.mollygram.com/?url=${encodeURIComponent(username)}`;
    const headers = {
      accept: "*/*",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      origin: "https://mollygram.com",
      referer: "https://mollygram.com/",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36",
    };

    const { data } = await axios.get(url, { headers });

    if (data.status !== "ok")
      return res.status(404).json({
        status: false,
        creator: "Bagus Bahril",
        message: "Gagal mengambil data Instagram",
      });

    const html = data.html;

    const getMatch = (regex) => {
      const match = html.match(regex);
      return match ? match[1].trim() : null;
    };

    const profilePic =
      getMatch(
        /<img[^>]*class="[^"]*rounded-circle[^"]*"[^>]*src="([^"]+)"/i
      ) ||
      getMatch(
        /<img[^>]*src="([^"]+)"[^>]*class="[^"]*rounded-circle[^"]*"/i
      );

    const result = {
      status: true,
      creator: "Bagus Bahril",
      username: getMatch(/<h4 class="mb-0">([^<]+)<\/h4>/),
      fullname: getMatch(/<p class="text-muted">([^<]+)<\/p>/),
      bio: getMatch(/<p class="text-dark"[^>]*>([^<]+)<\/p>/),
      profile_pic: profilePic,
      posts: getMatch(
        /<div[^>]*>\s*<span class="d-block h5 mb-0">([^<]+)<\/span>\s*<div[^>]*>posts<\/div>/i
      ),
      followers: getMatch(
        /<div[^>]*>\s*<span class="d-block h5 mb-0">([^<]+)<\/span>\s*<div[^>]*>followers<\/div>/i
      ),
      following: getMatch(
        /<div[^>]*>\s*<span class="d-block h5 mb-0">([^<]+)<\/span>\s*<div[^>]*>following<\/div>/i
      ),
    };

    return res.json(result);
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Terjadi kesalahan saat mengambil data",
    });
  }
});

module.exports = router;

/**
 * TikTok Stalker
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

// Proxy helper
const proxy = () => null; // Ganti sesuai implementasimu

async function tiktokStalk(user) {
  try {
    const targetUrl = proxy() ? proxy() + `https://tiktok.com/@${user}` : `https://tiktok.com/@${user}`;
    const { data: html } = await axios.get(targetUrl, {
      headers: {
        "User-Agent": "PostmanRuntime/7.32.2",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(html);
    const jsonData = $("#__UNIVERSAL_DATA_FOR_REHYDRATION__").text();
    const result = JSON.parse(jsonData);

    const userDetail = result["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]?.userInfo;
    const statusCode = result["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]?.statusCode;

    if (!userDetail || statusCode !== 0) {
      throw new Error("User TikTok tidak ditemukan!");
    }

    return userDetail;
  } catch (err) {
    throw new Error(`Error stalking TikTok user: ${err.message || err}`);
  }
}

// Endpoint Express
router.get("/stalk/tiktok", async (req, res) => {
  const username = req.query.user;
  if (!username) return res.status(400).json({ status: false, message: "Parameter 'user' dibutuhkan" });

  try {
    const userInfo = await tiktokStalk(username);
    res.json({ status: true, creator: "Bagus Bahril", user: userInfo });
  } catch (err) {
    res.status(500).json({ status: false, creator: "Bagus Bahril", message: err.message });
  }
});

module.exports = router;

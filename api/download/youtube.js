/**
 * YouTube Downloader API
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");
const qs = require("qs");
const router = express.Router();

async function ssvidDownloader(url, mediaType = "mp4") {
  const headers = {
    "x-requested-with": "XMLHttpRequest",
    "user-agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Safari/537.36",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    referer: "https://ssvid.net/en",
  };

  const searchData = qs.stringify({ query: url, vt: "home" });
  const searchRes = await axios.post(
    "https://ssvid.net/api/ajax/search?hl=en",
    searchData,
    { headers }
  );
  const searchJson = searchRes.data;

  if (searchJson.status !== "ok" || !searchJson.links || !searchJson.links[mediaType]) {
    throw new Error("No download links found");
  }

  const links = searchJson.links[mediaType];
  const firstKey = Object.keys(links)[0];
  const k = links[firstKey].k;
  const vid = searchJson.vid;

  const convertData = qs.stringify({ vid, k });
  const convertRes = await axios.post(
    "https://ssvid.net/api/ajax/convert?hl=en",
    convertData,
    { headers }
  );
  const convertJson = convertRes.data;

  if (convertJson.status !== "ok") {
    throw new Error("Convert failed");
  }

  return {
    dlink: convertJson.dlink,
    type: convertJson.ftype,
    title: convertJson.title,
  };
}

// Endpoint GET
router.get("/youtube", async (req, res) => {
  const url = req.query.url;
  const type = req.query.type || "mp4";

  if (!url) return res.status(400).json({ status: false, message: "Parameter 'url' dibutuhkan" });

  try {
    const result = await ssvidDownloader(url, type);
    res.json({ status: true, creator: "Bagus Bahril", result });
  } catch (err) {
    res.status(500).json({ status: false, creator: "Bagus Bahril", message: err.message });
  }
});

module.exports = router;

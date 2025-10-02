const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * Scrape Google Drive public file
 */
const driveScrape = async (url) => {
  try {
    if (!/drive\.google\.com\/file\/d\//gi.test(url)) {
      throw new Error("Invalid Google Drive URL");
    }

    const res = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(res.data);
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const id = idMatch ? idMatch[1] : null;
    if (!id) throw new Error("Cannot extract file ID from URL");

    const name = $("head title").text().trim().split(" - Google Drive")[0] || "Unknown";
    const download = `https://drive.google.com/uc?export=download&id=${id}`;

    return { name, link: url, download };
  } catch (e) {
    console.error("DriveScrape Error:", e.message);
    throw new Error("Failed to scrape Google Drive file");
  }
};

/**
 * GET /api/d/gdrive
 * Query: ?url=<Google Drive URL>
 */
router.get("/gdrive", async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).json({ status: false, error: "URL parameter is required" });
  if (typeof url !== "string" || !url.trim())
    return res.status(400).json({ status: false, error: "URL must be a non-empty string" });
  if (!/drive\.google\.com\/file\/d\//gi.test(url.trim()))
    return res.status(400).json({ status: false, error: "Invalid Google Drive URL format" });

  try {
    const data = await driveScrape(url.trim());

    res.json({
      status: true,
      creator: "Bagus Bahril",
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message || "Internal Server Error" });
  }
});

module.exports = router;

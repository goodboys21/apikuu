/**
 * Bing Image Search Scraper
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const AXIOS_OPTIONS = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36",
  },
  timeout: 30000,
};

function extractMediaUrl(url) {
  const match = url.match(/mediaurl=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function scrapeBingImage(query) {
  try {
    const { data } = await axios.get(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}`, AXIOS_OPTIONS);
    const $ = cheerio.load(data);
    const results = [];

    $(".imgpt > a").each((_, el) => {
      const mediaUrl = $(el).attr("href");
      if (mediaUrl) {
        const decodedUrl = extractMediaUrl(mediaUrl);
        if (decodedUrl) results.push(decodedUrl);
      }
    });

    return results;
  } catch (error) {
    console.error("Bing Image API Error:", error.message);
    return [];
  }
}

router.get("/bingimg", async (req, res) => {
  const query = req.query.q?.trim();
  if (!query) return res.status(400).json({ status: false, message: "Query parameter 'q' dibutuhkan" });

  try {
    let images = await scrapeBingImage(query);
    if (!images.length) return res.status(404).json({ status: false, message: "Tidak ditemukan gambar untuk pencarian ini." });

    // Ambil maksimal 10 hasil random
    images = images.sort(() => 0.5 - Math.random()).slice(0, 10);

    res.json({
      status: true,
      creator: "Bagus Bahril",
      keyword: query,
      total_results: images.length,
      results: images.map((img) => ({ image_url: img })),
    });
  } catch (err) {
    console.error("Bing Image error:", err.message);
    res.status(500).json({ status: false, creator: "Bagus Bahril", message: "Gagal mengambil data Bing Image" });
  }
});

module.exports = router;

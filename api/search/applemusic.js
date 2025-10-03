/**
 * Apple Music Search Scraper
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

router.get("/applemusic", async (req, res) => {
  const query = req.query.q?.trim();
  const region = req.query.region || "us"; // default US

  if (!query) return res.status(400).json({ status: false, message: "Query parameter 'q' dibutuhkan" });

  try {
    const { data } = await axios.get(`https://music.apple.com/${region}/search?term=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(data);
    const results = [];

    $(".top-search-lockup").each((_, element) => {
      const title = $(element).find(".top-search-lockup__primary__title").text().trim();
      const artist = $(element).find(".top-search-lockup__secondary").text().trim();
      const link = $(element).find(".click-action").attr("href");
      const image = $(element).find("picture source").attr("srcset")?.split(" ")[0] || null;

      if (title && artist && link) {
        results.push({
          title,
          artist,
          link: link.startsWith("http") ? link : `https://music.apple.com${link}`,
          image,
        });
      }
    });

    if (!results.length) return res.status(404).json({ status: false, message: "Tidak ditemukan hasil untuk pencarian ini." });

    // Ambil maksimal 10 hasil random
    const maxResults = Math.min(10, results.length);
    const selectedResults = [];
    const usedIndexes = new Set();
    while (selectedResults.length < maxResults) {
      const randomIndex = Math.floor(Math.random() * results.length);
      if (!usedIndexes.has(randomIndex)) {
        usedIndexes.add(randomIndex);
        selectedResults.push(results[randomIndex]);
      }
    }

    return res.json({
      status: true,
      creator: "Bagus Bahril",
      keyword: query,
      region,
      total_results: selectedResults.length,
      results: selectedResults,
    });
  } catch (err) {
    console.error("Apple Music error:", err.message);
    return res.status(500).json({ status: false, creator: "Bagus Bahril", message: "Gagal mengambil data Apple Music" });
  }
});

module.exports = router;

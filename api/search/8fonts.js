/**
 * 8Fonts Search Scraper
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

router.get("/8fonts", async (req, res) => {
  const query = req.query.q?.trim();
  const page = parseInt(req.query.page) || 1;

  if (!query) return res.status(400).json({ status: false, message: "Query parameter 'q' dibutuhkan" });

  try {
    const headers = {
      Accept: "*/*",
      "User-Agent": "Postify/1.0.0",
      "Content-Encoding": "gzip, deflate, br, zstd",
      "Content-Type": "application/json",
    };

    const { data } = await axios.get(`https://8font.com/page/${page}/?s=${encodeURIComponent(query)}`, {
      headers,
      timeout: 30000,
    });

    const $ = cheerio.load(data);
    const fonts = $(".card-body")
      .map((_, el) => ({
        title: $(el).find(".entry-title a").text(),
        link: $(el).find(".btn-primary").attr("href"),
        categories: $(el)
          .find(".post-info a")
          .map((_, e) => $(e).text())
          .get(),
        date: $(el).find(".post-info").contents().first().text().trim(),
        image: $(el).closest(".card").find("img").attr("src"),
      }))
      .get();

    if (!fonts.length) return res.status(404).json({ status: false, message: "No fonts found" });

    // Ambil maksimal 10 font random
    const maxResults = Math.min(10, fonts.length);
    const selectedFonts = [];
    const usedIndexes = new Set();
    while (selectedFonts.length < maxResults) {
      const randomIndex = Math.floor(Math.random() * fonts.length);
      if (!usedIndexes.has(randomIndex)) {
        usedIndexes.add(randomIndex);
        selectedFonts.push(fonts[randomIndex]);
      }
    }

    return res.json({
      status: true,
      creator: "Bagus Bahril",
      keyword: query,
      page,
      total_results: selectedFonts.length,
      fonts: selectedFonts,
    });
  } catch (err) {
    console.error("8Fonts error:", err.message);
    return res.status(500).json({ status: false, creator: "Bagus Bahril", message: "Gagal mengambil data 8Fonts" });
  }
});

module.exports = router;

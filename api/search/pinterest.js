/**
 * Pinterest Search Scraper via Siputzx API
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/pinterest", async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.status(400).json({ status: false, message: "Query parameter 'q' dibutuhkan" });

  try {
    const apiUrl = `https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);

    const results = response.data?.data;
    if (!results || !results.length) {
      return res.status(404).json({
        status: false,
        message: "Tidak ditemukan hasil untuk pencarian ini.",
      });
    }

    // ambil max 10 random
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

    // format hasil
    const formattedResults = selectedResults.map((pin) => ({
      pin_url: pin.pin || "Tidak tersedia",
      source_link: pin.link || "Tidak tersedia",
      created_at: pin.created_at || "Tidak tersedia",
      image_url: pin.images_url || "Tidak tersedia",
      title: pin.grid_title || "Tidak tersedia",
    }));

    return res.json({
      status: true,
      creator: "Bagus Bahril",
      results: formattedResults,
    });
  } catch (err) {
    console.error("Pinterest error:", err.message);
    return res.status(500).json({ status: false, creator: "Bagus Bahril", message: "Gagal mengambil data Pinterest" });
  }
});

module.exports = router;

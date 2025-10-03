/**
 * APKPure Search Scraper
 * Creator: Bagus Bahril
 */

const express = require("express");
const cloudscraper = require("cloudscraper");

const router = express.Router();

router.get("/apkpure", async (req, res) => {
  const keyword = req.query.keyword?.trim();
  const limit = parseInt(req.query.limit) || 20;

  if (!keyword) {
    return res.status(400).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Keyword parameter is required",
    });
  }

  const url = `https://apkpure.com/api/v1/search_suggestion_new?key=${encodeURIComponent(keyword)}&limit=${limit}`;

  try {
    const response = await cloudscraper.get(url);
    const results = JSON.parse(response);

    const filtered = results
      .map((x) => {
        if (!x?.packageName) return;
        return {
          app_name: x.title || null,
          package_name: x.packageName,
          version: x.version || null,
          developer: x.developer || null,
          download_url: `https://d.apkpure.com/b/APK/${x.packageName}?version=latest`,
          icon: x.icon || null,
        };
      })
      .filter(Boolean);

    return res.json({
      status: true,
      creator: "Bagus Bahril",
      keyword,
      total_results: filtered.length,
      results: filtered,
    });
  } catch (error) {
    console.error("❌ Gagal mengambil data APKPure:", error.message);
    return res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Terjadi kesalahan saat mengambil data APKPure",
    });
  }
});

module.exports = router;

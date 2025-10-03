/**
 * YouTube Search Scraper
 * Creator: Bagus Bahril
 */

const express = require("express");
const yts = require("yt-search");

const router = express.Router();

router.get("/youtube", async (req, res) => {
  const query = req.query.q?.trim();

  if (!query) {
    return res.status(400).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Query parameter 'q' is required",
    });
  }

  try {
    const results = await yts(query);
    const videos = results.all.map((video) => ({
      title: video.title,
      videoId: video.videoId,
      url: video.url,
      duration: video.timestamp,
      views: video.views,
      author: video.author.name,
      authorUrl: video.author.url,
      uploadedAt: video.ago,
    }));

    return res.json({
      status: true,
      creator: "Bagus Bahril",
      query,
      total_results: videos.length,
      results: videos,
    });
  } catch (error) {
    console.error("❌ Gagal mengambil data YouTube:", error.message);
    return res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Terjadi kesalahan saat mengambil data YouTube",
    });
  }
});

module.exports = router;

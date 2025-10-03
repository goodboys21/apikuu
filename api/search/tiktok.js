/**
 * TikTok Search Scraper
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/tiktok", async (req, res) => {
  const keyword = req.query.q?.trim();
  if (!keyword) {
    return res.status(400).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Query parameter 'q' dibutuhkan",
    });
  }

  try {
    const url = `https://tikwm.com/api/feed/search?keywords=${encodeURIComponent(keyword)}`;
    const { data } = await axios.get(url, { timeout: 15000 });

    if (data.code !== 0 || !data.data?.videos?.length) {
      return res.status(404).json({
        status: false,
        creator: "Bagus Bahril",
        message: "Video tidak ditemukan",
      });
    }

    // ambil 10 video random
    const videos = data.data.videos;
    const shuffled = videos.sort(() => 0.5 - Math.random()).slice(0, 10);

    const results = shuffled.map((v) => ({
      video_id: v.video_id,
      title: v.title,
      duration: v.duration,
      cover: v.cover,
      origin_cover: v.origin_cover,
      play_url: v.play,
      wmplay_url: v.wmplay,
      music: v.music,
      music_info: v.music_info,
      author: v.author,
      play_count: v.play_count,
      digg_count: v.digg_count,
      comment_count: v.comment_count,
      share_count: v.share_count,
      download_count: v.download_count,
    }));

    return res.json({
      status: true,
      creator: "Bagus Bahril",
      keyword,
      total_results: results.length,
      results,
    });
  } catch (error) {
    console.error("❌ Gagal mengambil data TikTok:", error.message);
    return res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Terjadi kesalahan saat mengambil data TikTok",
    });
  }
});

module.exports = router;

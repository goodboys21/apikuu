/**
 * Snack Video Downloader (Scrape)
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

router.get("/snackvideo", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res
      .status(400)
      .json({ success: false, message: "Masukkan parameter ?url=" });
  }

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(html);
    const videoDataScript = $("#VideoObject").html();

    if (!videoDataScript) {
      return res
        .status(404)
        .json({ success: false, message: "Video data not found on the page." });
    }

    const videoData = JSON.parse(videoDataScript);

    const formatDuration = (duration) => {
      const match = duration.match(/^PT(\d+)M(\d+)S$/);
      if (match) return `${match[1]} minutes ${match[2]} seconds`;
      return duration;
    };

    const result = {
      success: true,
      creator: "Bagus Bahril",
      title: videoData.name || "",
      description: videoData.description || "",
      thumbnail: videoData.thumbnailUrl ? videoData.thumbnailUrl[0] : "",
      uploadDate: videoData.uploadDate
        ? new Date(videoData.uploadDate).toISOString().split("T")[0]
        : "",
      videoUrl: videoData.contentUrl || "",
      duration: formatDuration(videoData.duration || ""),
      interaction: {
        views:
          videoData.interactionStatistic?.find(
            (stat) =>
              stat.interactionType["@type"] === "https://schema.org/WatchAction"
          )?.userInteractionCount || 0,
        likes:
          videoData.interactionStatistic?.find(
            (stat) =>
              stat.interactionType["@type"] === "https://schema.org/LikeAction"
          )?.userInteractionCount || 0,
        shares:
          videoData.interactionStatistic?.find(
            (stat) =>
              stat.interactionType["@type"] === "https://schema.org/ShareAction"
          )?.userInteractionCount || 0,
      },
      creatorInfo: {
        name: videoData.creator?.mainEntity?.name || "",
        profileUrl: videoData.creator?.mainEntity?.url || "",
        bio: videoData.creator?.mainEntity?.description || "",
      },
    };

    res.json(result);
  } catch (err) {
    console.error("SnackVideo Scrape Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server: " + err.message,
    });
  }
});

module.exports = router;

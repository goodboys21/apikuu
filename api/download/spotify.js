/**
 * Spotify Downloader (Scrape Downloaderize)
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/spotify", async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res
      .status(400)
      .json({ success: false, message: "Masukkan parameter ?url=" });
  }

  try {
    const payload = new URLSearchParams({
      action: "spotify_downloader_get_info",
      url,
      nonce: "e83bc742a0", // ⚠️ nonce bisa expired, nanti harus update scrape baru
    });

    const { data } = await axios.post(
      "https://spotify.downloaderize.com/wp-admin/admin-ajax.php",
      payload,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
          "Referer": "https://spotify.downloaderize.com/",
        },
      }
    );

    if (!data.success || !data.data) {
      return res.status(404).json({
        success: false,
        message: "Gagal mengambil data dari Spotify",
      });
    }

    const result = data.data;

    return res.json({
      success: true,
      creator: "Bagus Bahril",
      title: result.title || "Unknown",
      artist: result.author || "Unknown",
      cover: result.thumbnail || null,
      duration: result.duration || null,
      download:
        result.medias?.map((m) => ({
          quality: m.quality,
          type: m.type,
          extension: m.extension,
          url: m.url,
        })) || [],
    });
  } catch (err) {
    console.error("Error Spotify Downloader:", err.message);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server: " + err.message,
    });
  }
});

module.exports = router;

/**
 * Mediafire Downloader
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/mediafire", async (req, res) => {
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
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
      },
    });

    // Regex download link dari script `window.location.href = '...'`
    const dlMatch = html.match(/window\.location\.href\s*=\s*'(.*?)'/);
    const download = dlMatch ? dlMatch[1] : null;

    // Meta parsing (judul, cover, dll)
    const titleMatch = html.match(/<meta property="og:title" content="(.*?)"/);
    const title = titleMatch ? titleMatch[1] : "Unknown";

    const imageMatch = html.match(/<meta property="og:image" content="(.*?)"/);
    const cover = imageMatch ? imageMatch[1] : null;

    const fileUrlMatch = html.match(/<meta property="og:url" content="(.*?)"/);
    const fileUrl = fileUrlMatch ? fileUrlMatch[1] : url;

    if (!download) {
      return res.json({
        success: false,
        message: "Gagal ambil link download dari MediaFire",
      });
    }

    return res.json({
      success: true,
      creator: "Bagus Bahril",
      title,
      file: fileUrl,
      download,
    });
  } catch (err) {
    console.error("Error MediaFire:", err.message);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server: " + err.message,
    });
  }
});

module.exports = router;

/**
 * Mediafire Downloader (Fix Login Redirect)
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

    // ambil title
    const titleMatch = html.match(/<meta property="og:title" content="(.*?)"/);
    const title = titleMatch ? titleMatch[1] : "Unknown";

    // ambil file url (og:url)
    const fileUrlMatch = html.match(/<meta property="og:url" content="(.*?)"/);
    const fileUrl = fileUrlMatch ? fileUrlMatch[1] : url;

    // ambil direct download
    let download = null;

    // 1. cek di window.location.href
    const dlMatch = html.match(/window\.location\.href\s*=\s*'(.*?)'/);
    if (dlMatch) download = dlMatch[1];

    // 2. fallback ke tombol download
    if (!download || download.includes("/login")) {
      const aMatch = html.match(
        /href="(https?:\/\/download[^"]+)"[^>]*>\s*Download\s*<\/a>/i
      );
      if (aMatch) download = aMatch[1];
    }

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

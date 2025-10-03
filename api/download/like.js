/**
 * Likee Video Scraper
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

router.get("/like", async (req, res) => {
  const url = req.query.url?.trim();

  if (!url) {
    return res.status(400).json({
      status: false,
      creator: "Bagus Bahril",
      message: "URL parameter is required",
    });
  }

  try {
    const formData = new URLSearchParams({ id: url, locale: "en" });
    const { data } = await axios.post(
      "https://likeedownloader.com/process",
      formData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36",
          "X-Requested-With": "XMLHttpRequest",
          Origin: "https://likeedownloader.com",
          Referer: "https://likeedownloader.com/en",
        },
      }
    );

    if (!data.template) {
      return res.status(404).json({
        status: false,
        creator: "Bagus Bahril",
        message: "Gagal ambil data Likee",
      });
    }

    const $ = cheerio.load(data.template);
    const info = $("p.infotext").first().text().trim() || null;

    let withWatermark = null;
    let withoutWatermark = null;

    $("a.download_link").each((i, el) => {
      const href = $(el).attr("href");
      if ($(el).hasClass("with_watermark")) withWatermark = href;
      if ($(el).hasClass("without_watermark")) withoutWatermark = href;
    });

    return res.json({
      status: true,
      creator: "Bagus Bahril",
      info,
      downloads: {
        with_watermark: withWatermark,
        without_watermark: withoutWatermark,
      },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Terjadi kesalahan saat mengambil data Likee",
    });
  }
});

module.exports = router;

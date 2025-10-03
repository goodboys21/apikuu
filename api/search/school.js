/**
 * Sekolah Search
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

async function sekolahSearch(namasekolah) {
  const response = await axios.post(
    "https://sekolah.link/wp-admin/admin-ajax.php",
    new URLSearchParams({
      action: "get_sekolah_items",
      item_location: "",
      "item-type": "",
      changed: "",
      posts_per_page: "20",
      orderby: "title",
      order: "ASC",
      active_map: "",
      "search-filter": namasekolah,
    }).toString(),
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
        Referer: "https://sekolah.link/website-sekolah/",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const $ = cheerio.load(response.data.content);
  const result = [];

  $(".listing-islamitische-item").each((_, el) => {
    const link = $(el).find(".title-listing a").attr("href");
    const nama = $(el).find(".title-listing a").text().trim();
    const lokasi = $(el).find(".info-address").text().trim();
    const gambar = $(el).find("img").attr("src");
    result.push({ nama, lokasi, link, gambar });
  });

  return result;
}

// Endpoint GET
router.get("/school", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Parameter 'q' (nama sekolah) dibutuhkan",
    });
  }

  try {
    const result = await sekolahSearch(query);
    res.json({
      status: true,
      creator: "Bagus Bahril",
      result,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: err.message,
    });
  }
});

module.exports = router;

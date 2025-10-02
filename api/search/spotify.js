/**
 * Spotify Search (Scrape Downloaderize)
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/spotify", async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res
      .status(400)
      .json({ success: false, message: "Masukkan parameter ?q=" });
  }

  try {
    const { data } = await axios.get(
      "https://spotify.downloaderize.com/wp-admin/admin-ajax.php",
      {
        params: {
          action: "sts_search_spotify",
          query: q,
          security: "b5d99b42a2", // ⚠️ security token (nonce) bisa expired
        },
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
          Referer: "https://spotify.downloaderize.com/",
        },
      }
    );

    if (!data.success || !data.data?.tracks?.items) {
      return res.json({
        success: false,
        message: "Tidak ada hasil ditemukan",
      });
    }

    // Ambil maksimal 15 hasil
    const results = data.data.tracks.items.slice(0, 15).map((item) => ({
      id: item.id,
      title: item.name,
      artists: item.album.artists.map((a) => a.name).join(", "),
      album: item.album.name,
      type: item.album.album_type,
      release_date: item.album.release_date,
      url: item.external_urls.spotify,
      cover: item.album.images?.[0]?.url || null,
    }));

    return res.json({
      success: true,
      creator: "Bagus Bahril",
      results,
      count: results.length, // opsional, biar tau jumlah result
    });
  } catch (err) {
    console.error("Error Spotify Search:", err.message);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server: " + err.message,
    });
  }
});

module.exports = router;

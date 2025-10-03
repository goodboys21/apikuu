/**
 * Tebak Anime
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/tebakanime", async (req, res) => {
  try {
    // Ambil semua data tebakanime dari API
    const { data } = await axios.get("https://apikuu-black.vercel.app/ta", {
      timeout: 30000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Tidak ditemukan soal tebakanime",
      });
    }

    // Ambil random satu soal
    const randomIndex = Math.floor(Math.random() * data.length);
    const soal = data[randomIndex];

    return res.json({
      status: true,
      creator: "Bagus Bahril",
      jawaban: soal.jawaban || "Tidak tersedia",
      image: soal.image || null,
      desc: soal.desc || "",
      url: soal.url || "",
    });
  } catch (error) {
    console.error("Error fetching tebakanime:", error.message);
    return res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Gagal mengambil soal tebakanime",
    });
  }
});

module.exports = router;

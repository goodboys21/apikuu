/**
 * Tebak Bendera
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/tebakbendera", async (req, res) => {
  try {
    // Ambil semua data tebakk bendera dari API
    const { data } = await axios.get("https://apikuu-black.vercel.app/tb", {
      timeout: 30000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Tidak ditemukan soal tebak bendera",
      });
    }

    // Ambil random satu soal
    const randomIndex = Math.floor(Math.random() * data.length);
    const soal = data[randomIndex];

    return res.json({
      status: true,
      creator: "Bagus Bahril",
      soal: soal.soal || "Tidak tersedia",
      jawaban: soal.jawaban || "Tidak tersedia",
    });
  } catch (error) {
    console.error("Error fetching tebak bendera:", error.message);
    return res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Gagal mengambil soal tebak bendera",
    });
  }
});

module.exports = router;

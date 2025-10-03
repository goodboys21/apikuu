/**
 * Game Tebak Kata Random
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/susunkata", async (req, res) => {
  try {
    // Ambil semua soal dari JSON
    const { data } = await axios.get("https://apikuu-black.vercel.app/sk", {
      timeout: 30000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Tidak ditemukan soal susun kata",
      });
    }

    // Ambil soal random
    const randomIndex = Math.floor(Math.random() * data.length);
    const soal = data[randomIndex];

    return res.json({
      status: true,
      creator: "Bagus Bahril",
      game: {
        soal: soal.soal || "Tidak tersedia",
        tipe: soal.tipe || "Tidak tersedia",
        jawaban: soal.jawaban || "Tidak tersedia",
      },
    });
  } catch (error) {
    console.error("Error fetching tebak kata:", error.message);
    return res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Gagal mengambil soal tebak kata",
    });
  }
});

module.exports = router;

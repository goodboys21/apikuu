/**
 * Tebak Kimia
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/tebakkimia", async (req, res) => {
  try {
    // Ambil semua data tebakkimia dari GitHub
    const { data } = await axios.get(
      "https://raw.githubusercontent.com/BochilTeam/database/refs/heads/master/games/tebakkimia.json",
      { timeout: 30000, headers: { "User-Agent": "Mozilla/5.0" } }
    );

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Tidak ditemukan soal Tebak Kimia",
      });
    }

    // Ambil random satu soal
    const randomIndex = Math.floor(Math.random() * data.length);
    const soal = data[randomIndex];

    return res.json({
      status: true,
      creator: "Bagus Bahril",
      unsur: soal.unsur || "Tidak tersedia",
      lambang: soal.lambang || "Tidak tersedia",
    });
  } catch (error) {
    console.error("Error fetching tebakkimia:", error.message);
    return res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Gagal mengambil soal Tebak Kimia",
    });
  }
});

module.exports = router;

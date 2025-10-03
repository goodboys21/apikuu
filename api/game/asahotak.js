/**
 * Asah Otak
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/asahotak", async (req, res) => {
  try {
    // Ambil semua data asahotak dari GitHub
    const { data } = await axios.get(
      "https://raw.githubusercontent.com/BochilTeam/database/refs/heads/master/games/asahotak.json",
      { timeout: 30000, headers: { "User-Agent": "Mozilla/5.0" } }
    );

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Tidak ditemukan soal asah otak",
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
    console.error("Error fetching asahotak:", error.message);
    return res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Gagal mengambil soal asah otak",
    });
  }
});

module.exports = router;

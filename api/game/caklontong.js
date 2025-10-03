/**
 * Cak Lontong
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/caklontong", async (req, res) => {
  try {
    // Ambil semua data caklontong dari GitHub
    const { data } = await axios.get(
      "https://raw.githubusercontent.com/BochilTeam/database/refs/heads/master/games/caklontong.json",
      { timeout: 30000, headers: { "User-Agent": "Mozilla/5.0" } }
    );

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Tidak ditemukan soal Cak Lontong",
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
      deskripsi: soal.deskripsi || "",
    });
  } catch (error) {
    console.error("Error fetching caklontong:", error.message);
    return res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Gagal mengambil soal Cak Lontong",
    });
  }
});

module.exports = router;

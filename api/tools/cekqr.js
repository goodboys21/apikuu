const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/cekqr", async (req, res) => {
  try {
    const qrUrl = req.query.url;
    if (!qrUrl) return res.json({
      success: false,
      creator: "Bagus Bahril",
      message: "Param 'url' wajib diisi (link QR Code)"
    });

    const apiRes = await axios.get("https://quickchart.io/qr-read", {
      params: { url: qrUrl },
      timeout: 15000
    });

    const result = apiRes.data?.result || null;

    if (!result) {
      return res.json({
        success: false,
        creator: "Bagus Bahril",
        message: "QR Code tidak terbaca"
      });
    }

    return res.json({
      success: true,
      creator: "Bagus Bahril",
      result
    });

  } catch (err) {
    return res.json({
      success: false,
      creator: "Bagus Bahril",
      message: err.message || "Terjadi error saat cek QR"
    });
  }
});

module.exports = router;

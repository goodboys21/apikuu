const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const router = express.Router();

router.get("/tobugil", async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) return res.json({
      success: false,
      creator: "Bagus Bahril",
      message: "Param 'url' wajib diisi"
    });

    const apiKey = "bagus"; // sesuai contoh
    const apiRes = await axios.get(`https://goodplay.xyz/hijabin.php?apikey=${apiKey}&url=${encodeURIComponent(imageUrl)}`);

    if (!apiRes.data || !apiRes.data.success) {
      return res.json({
        success: false,
        creator: "Bagus Bahril",
        message: apiRes.data?.message || "Gagal memproses gambar"
      });
    }

    // opsional: upload ke server-jees
    const resultUrl = apiRes.data.result;

    return res.json({
      success: true,
      creator: "Bagus Bahril",
      url: resultUrl
    });

  } catch (err) {
    return res.json({
      success: false,
      creator: "Bagus Bahril",
      message: err.message || "Terjadi error saat RC"
    });
  }
});

module.exports = router;

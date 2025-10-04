const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const router = express.Router();

router.get("/text2qr", async (req, res) => {
  try {
    const text = req.query.text;
    if (!text) return res.json({
      success: false,
      creator: "Bagus Bahril",
      message: "Param 'text' wajib diisi"
    });

    // Generate QR dari QuickChart
    const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(text)}`;

    const qrRes = await axios.get(qrUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(qrRes.data);

    // Upload ke server-jees
    const form = new FormData();
    form.append("file", buffer, { filename: "qr.png" });

    const uploadRes = await axios.post(
      "https://server-jees2.vercel.app/upload",
      form,
      { headers: form.getHeaders() }
    );

    return res.json({
      success: true,
      creator: "Bagus Bahril",
      text,
      url: uploadRes.data.url
    });

  } catch (err) {
    return res.json({
      success: false,
      creator: "Bagus Bahril",
      message: err.message || "Terjadi error saat generate QR"
    });
  }
});

module.exports = router;

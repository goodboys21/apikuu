const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const router = express.Router();
const upload = multer();

// === Konfigurasi dasar ===
const UPLOAD_URL = "https://server-jees2.vercel.app/upload";
const CREATOR = "Bagus Bahril";

router.post("/tourl", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        creator: CREATOR,
        message: "File tidak ditemukan. Gunakan key form 'file'.",
      });
    }

    // buat form-data untuk dikirim ke server-jees2
    const form = new FormData();
    form.append("file", req.file.buffer, req.file.originalname);

    const uploadRes = await axios.post(UPLOAD_URL, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      timeout: 60000,
    });

    // ambil data hasil upload
    const data = uploadRes.data;

    const uploaded_at = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
    });

    res.json({
      status: true,
      creator: CREATOR,
      filename: req.file.originalname,
      uploaded_at,
      result: data,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      creator: CREATOR,
      message: "Gagal upload ke server-jees2.",
      error: err.message,
    });
  }
});

module.exports = router;

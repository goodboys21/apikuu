const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cheerio = require('cheerio');

const router = express.Router();
const upload = multer();

router.post('/sfile', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: false,
      creator: 'Bagus Bahril',
      message: 'File tidak ditemukan. Pastikan menggunakan field "file".'
    });
  }

  try {
    const form = new FormData();
    form.append('file1', req.file.buffer, req.file.originalname);
    form.append('des', 'Uploaded via Express API');

    const uploadRes = await axios.post(
      'https://sfile.mobi/guest_remote_parser.php',
      form,
      { headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' } }
    );

    // Parse HTML
    const $ = cheerio.load(uploadRes.data);
    const fileLink = $('div.news a').first().attr('href') || $('input[type="text"]').val();

    if (!fileLink) {
      return res.status(500).json({
        status: false,
        creator: 'Bagus Bahril',
        message: 'Gagal mendapatkan link file dari Sfile.',
        raw: uploadRes.data
      });
    }

    res.json({
      status: true,
      creator: 'Bagus Bahril',
      filename: req.file.originalname,
      uploaded_at: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      url: fileLink
    });

  } catch (err) {
    res.status(500).json({
      status: false,
      creator: 'Bagus Bahril',
      message: 'Gagal upload ke Sfile.',
      error: err.message
    });
  }
});

module.exports = router;

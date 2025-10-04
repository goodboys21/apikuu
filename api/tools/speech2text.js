const express = require('express');
const axios = require('axios');
const router = express.Router();

// Endpoint: /shorturl?url=...
router.get('/shorturl', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      creator: 'Bagus Bahril',
      message: 'Parameter "url" wajib diisi.'
    });
  }

  try {
    const apiRes = await axios.get('https://shogood.zone.id/short', {
      params: { url },
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const short = apiRes.data?.short;
    if (!short) throw new Error('Gagal mendapatkan shortlink.');

    res.json({
      status: true,
      creator: 'Bagus Bahril',
      original: url,
      short
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      creator: 'Bagus Bahril',
      message: err.message
    });
  }
});

module.exports = router;

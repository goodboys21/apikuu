
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const router = express.Router();

router.get('/tiktok', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, message: 'Masukkan parameter ?url=' });
  }

  try {
    const headers = {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'referer': 'https://tikdownloader.io/id',
      'x-requested-with': 'XMLHttpRequest',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    };

    const resTik = await axios.post(
      'https://tikdownloader.io/api/ajaxSearch',
      `q=${encodeURIComponent(url)}`,
      { headers }
    );

    const $ = cheerio.load(resTik.data.data);
    const title = $('.tik-left .content h3').text().trim();
    const coverImage = $('.image-tik img').attr('src') || null;

    let videoNowm = null;
    let videoNowmHd = null;
    let musicUrl = null;

    $('.tik-button-dl').each((i, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr('href');
      if (!href?.startsWith('http')) return;

      if (text.includes('hd')) {
        videoNowmHd = href;
      } else if (text.includes('download video')) {
        videoNowm = href;
      } else if (text.includes('music') || text.includes('mp3')) {
        musicUrl = href;
      }
    });

    if (!videoNowm && !videoNowmHd) {
      return res.status(404).json({
        success: false,
        message: 'Gagal mendapatkan link video TikTok.',
      });
    }

    return res.json({
      success: true,
      creator: "Bagus Bahril",
      title: title || 'Tanpa Judul',
      cover: coverImage,
      video: {
        nowatermark: videoNowm || null,
        nowatermark_hd: videoNowmHd || null
      },
      music: musicUrl || null
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

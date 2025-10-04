const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const router = express.Router();
const upload = multer();

let sessionToken = '72e7a7ea772d8898bde7f33b0822a0b1b6633c3b512ce05aed3c535fefb3c48f75388da99766f77da3d2b474bc09f2e9557d9034424fe41140f370e814a07a505104d5f01c62b24a';
const refreshToken = '72e7a7ea772d8898bde7f33b0822a0b1b6633c3b512ce05aed3c535fefb3c48f75388da99766f77da3d2b474bc09f2e9557d9034424fe41140f370e814a07a505104d5f01c62b24a';
let lastRefresh = 0;

async function refreshSessionToken() {
  try {
    const { data } = await axios.post(
      `https://www.mediafire.com/api/1.1/user/renew_session_token.php?session_token=${refreshToken}`,
      null,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const match = data.match(/<session_token>(.*?)<\/session_token>/);
    if (match) {
      sessionToken = match[1];
      console.log('✅ Session token diperbarui');
    } else {
      console.error('❌ Gagal parsing token baru');
    }
  } catch (err) {
    console.error('❌ Gagal refresh session token:', err.message);
  }
}

// POST /mdfup
router.post('/mdfup', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: false,
      creator: 'Bagus Bahril',
      message: "File tidak ditemukan. Pastikan kirim dengan key 'file'."
    });
  }

  const now = Date.now();
  if (now - lastRefresh > 50000) {
    await refreshSessionToken();
    lastRefresh = now;
  }

  try {
    const fileExt = req.file.originalname.split('.').pop();
    const fileBase = req.file.originalname.replace(/\.[^/.]+$/, '');
    const randomId = Math.floor(Math.random() * 900 + 100); // 3 angka acak
    const newFileName = `${fileBase}_${randomId}.${fileExt}`;

    const form = new FormData();
    form.append('file', req.file.buffer, newFileName);

    const uploadRes = await axios.post(
      `https://www.mediafire.com/api/1.5/upload/simple.php?session_token=${sessionToken}`,
      form,
      { headers: form.getHeaders() }
    );

    const xml = uploadRes.data;
    const keyMatch = xml.match(/<quickkey>(.*?)<\/quickkey>/);

    if (!keyMatch) {
      return res.status(500).json({
        status: false,
        creator: 'Bagus Bahril',
        message: 'Gagal mendapatkan quickkey MediaFire.',
        raw: xml
      });
    }

    const quickkey = keyMatch[1];
    const download_url = `https://www.mediafire.com/file/${quickkey}/${encodeURIComponent(newFileName)}/file`;
    const view_url = `https://www.mediafire.com/view/${quickkey}/${encodeURIComponent(newFileName)}`;
    const uploadDate = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    res.json({
      status: true,
      creator: 'Bagus Bahril',
      filename: newFileName,
      uploaded_at: uploadDate,
      download_url,
      view_url
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      creator: 'Bagus Bahril',
      message: 'Gagal upload ke MediaFire.',
      error: err.message
    });
  }
});

module.exports = router;

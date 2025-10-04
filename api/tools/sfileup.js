// file: mdfup.js
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const router = express.Router();
const upload = multer();

// token awal (boleh diganti/refresh sesuai kebutuhan)
let sessionToken = '72e7a7ea772d8898bde7f33b0822a0b1b6633c3b512ce05aed3c535fefb3c48f75388da99766f77da3d2b474bc09f2e9557d9034424fe41140f370e814a07a505104d5f01c62b24a';
const refreshToken = sessionToken;
let lastRefresh = 0;

async function refreshSessionToken() {
  try {
    const { data } = await axios.post(
      `https://www.mediafire.com/api/1.1/user/renew_session_token.php?session_token=${refreshToken}`,
      null,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
    );
    // cari <session_token>...</session_token>
    const m = String(data).match(/<session_token>(.*?)<\/session_token>/i);
    if (m) {
      sessionToken = m[1];
      console.log('✅ Session token diperbarui.');
    } else {
      console.warn('⚠️ Response renew token tidak berisi session_token, abaikan.');
    }
  } catch (err) {
    console.error('❌ Gagal refresh session token:', err.message);
  }
}

function makeRandom3() {
  return Math.floor(Math.random() * 900 + 100); // 100-999
}

// Endpoint: POST /mdfup
// Form field: file (multipart/form-data)
router.post('/mdfup', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: false,
      creator: 'Bagus Bahril',
      message: "File tidak ditemukan. Pastikan form field bernama 'file'."
    });
  }

  // refresh token kecil2 tiap >50s
  const now = Date.now();
  if (now - lastRefresh > 50000) {
    await refreshSessionToken();
    lastRefresh = now;
  }

  try {
    // bangun nama file baru: originalBase_random3.ext
    const original = req.file.originalname || 'file';
    const ext = (original.includes('.') ? original.split('.').pop() : '');
    const base = original.replace(/\.[^/.]+$/, '');
    const rand = makeRandom3();
    const newFileName = ext ? `${base}_${rand}.${ext}` : `${base}_${rand}`;

    // upload ke MediaFire simple upload api
    const form = new FormData();
    form.append('file', req.file.buffer, newFileName);

    const uploadUrl = `https://www.mediafire.com/api/1.5/upload/simple.php?session_token=${sessionToken}`;
    const uploadRes = await axios.post(uploadUrl, form, {
      headers: { ...form.getHeaders() },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 60000
    });

    const xml = String(uploadRes.data || '');

    // coba cari key di beberapa kemungkinan tag: <doupload><key> or <key> or <quickkey>
    let keyMatch = xml.match(/<doupload>[\s\S]*?<key>(.*?)<\/key>/i)
                || xml.match(/<key>(.*?)<\/key>/i)
                || xml.match(/<quickkey>(.*?)<\/quickkey>/i);

    if (!keyMatch) {
      // kembalikan raw response untuk debugging
      return res.status(500).json({
        status: false,
        creator: 'Bagus Bahril',
        message: 'Gagal mendapatkan quickkey MediaFire.',
        raw: xml
      });
    }

    const key = keyMatch[1];

    // Bentuk URL download/view generik (MediaFire menggunakan beberapa pola; pola berikut bekerja umum)
    const download_url = `https://www.mediafire.com/file/${key}/${encodeURIComponent(newFileName)}/file`;
    const view_url = `https://www.mediafire.com/file/${key}/${encodeURIComponent(newFileName)}`;

    const uploadDate = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    return res.json({
      status: true,
      creator: 'Bagus Bahril',
      filename: newFileName,
      uploaded_at: uploadDate,
      download_url,
      view_url,
      raw_key: key
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      creator: 'Bagus Bahril',
      message: 'Gagal upload ke MediaFire.',
      error: err.message
    });
  }
});

module.exports = router;

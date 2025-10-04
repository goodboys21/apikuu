// mdfup-fix.js
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const router = express.Router();
const upload = multer();

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
    const m = String(data).match(/<session_token>(.*?)<\/session_token>/i);
    if (m) {
      sessionToken = m[1];
      console.log('✅ Session token diperbarui.');
    }
  } catch (err) {
    console.error('❌ Gagal refresh session token:', err.message);
  }
}

function makeRandom3() {
  return Math.floor(Math.random() * 900 + 100);
}

router.post('/mdfup', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: false,
      creator: 'Bagus Bahril',
      message: "File tidak ditemukan. Pastikan field form bernama 'file'."
    });
  }

  const now = Date.now();
  if (now - lastRefresh > 50000) {
    await refreshSessionToken();
    lastRefresh = now;
  }

  try {
    const original = req.file.originalname || 'file';
    const ext = (original.includes('.') ? original.split('.').pop() : '');
    const base = original.replace(/\.[^/.]+$/, '');
    const rand = makeRandom3();
    const newFileName = ext ? `${base}_${rand}.${ext}` : `${base}_${rand}`;

    const form = new FormData();
    form.append('file', req.file.buffer, newFileName);

    const uploadUrl = `https://www.mediafire.com/api/1.5/upload/simple.php?session_token=${sessionToken}`;
    const uploadRes = await axios.post(uploadUrl, form, {
      headers: { ...form.getHeaders() },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 60000,
    });

    const xml = String(uploadRes.data || '');

    // cari key di beberapa pola
    let keyMatch = xml.match(/<doupload>[\s\S]*?<key>(.*?)<\/key>/i)
                || xml.match(/<key>(.*?)<\/key>/i)
                || xml.match(/<quickkey>(.*?)<\/quickkey>/i);

    if (!keyMatch) {
      return res.status(500).json({
        status: false,
        creator: 'Bagus Bahril',
        message: 'Gagal mendapatkan quickkey MediaFire.',
        raw: xml
      });
    }

    const key = keyMatch[1];

    // Ambil URL final / view URL dengan mengikuti redirect
    let finalUrl = null;
    try {
      const infoRes = await axios.get(`https://www.mediafire.com/file/${key}`, {
        // biarkan axios follow redirect; kita ingin URL akhir
        maxRedirects: 5,
        timeout: 20000,
        validateStatus: null,
      });

      // axios menyimpan URL akhir di response.request.res.responseUrl (Node)
      finalUrl = infoRes.request && infoRes.request.res && infoRes.request.res.responseUrl
        ? infoRes.request.res.responseUrl
        : null;

      // fallback: jika tidak tersedia, coba bentuk canonical view url
      if (!finalUrl) {
        finalUrl = `https://www.mediafire.com/view/${key}/${encodeURIComponent(newFileName)}`;
      }
    } catch (e) {
      // fallback ke pola view jika request info gagal
      finalUrl = `https://www.mediafire.com/view/${key}/${encodeURIComponent(newFileName)}`;
    }

    // normalize view & download URLs
    // beberapa bentuk finalUrl mungkin sudah mengandung /file/ atau /view/
    let view_url = finalUrl;
    if (!/\/view\/|\/file\//.test(view_url)) {
      view_url = `https://www.mediafire.com/view/${key}/${encodeURIComponent(newFileName)}`;
    }
    const download_url = view_url.endsWith('/') ? `${view_url}file` : `${view_url}/file`;

    const uploadDate = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    return res.json({
      status: true,
      creator: 'Bagus Bahril',
      filename: newFileName,
      uploaded_at: uploadDate,
      download_url,
      view_url,
      raw_key: key,
      note: 'Jika link download masih tidak bisa diakses, buka view_url di browser lalu salin URL yang muncul (MediaFire kadang memetakan key berbeda).'
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

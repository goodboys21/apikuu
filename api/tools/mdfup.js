// routes/mdfup-mediafire.js
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const router = express.Router();
const upload = multer();

// === MASUKIN SESSION TOKEN LO DI SINI ===
const SESSION_TOKEN = '72e7a7ea772d8898bde7f33b0822a0b1b6633c3b512ce05aed3c535fefb3c48f75388da99766f77da3d2b474bc09f2e9557d9034424fe41140f370e814a07a505104d5f01c62b24a';
// =======================================

function rand3() {
  return Math.floor(Math.random() * 900 + 100);
}

async function uploadInit(sessionToken, fileBuffer, filename) {
  const url = `https://www.mediafire.com/api/upload/upload.php?session_token=${encodeURIComponent(sessionToken || '')}`;
  const form = new FormData();
  // nama field 'filename' sesuai contoh curl
  form.append('filename', fileBuffer, filename);
  form.append('uploadapi', 'yes');
  form.append('response_format', 'json');

  const res = await axios.post(url, form, {
    headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' },
    maxBodyLength: Infinity,
    timeout: 60000,
    validateStatus: s => s >= 200 && s < 500
  });

  // Return raw response body (could be XML or JSON string)
  return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
}

async function pollUpload(sessionToken, key) {
  const url = `https://www.mediafire.com/api/upload/poll_upload.php?session_token=${encodeURIComponent(sessionToken || '')}`;
  const form = new FormData();
  form.append('key', key);
  form.append('response_format', 'json');

  const res = await axios.post(url, form, {
    headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' },
    timeout: 60000,
    validateStatus: s => s >= 200 && s < 500
  });

  return res.data;
}

function extractKeyFromXml(xmlText) {
  if (!xmlText) return null;
  const m = String(xmlText).match(/<key>(.*?)<\/key>/i);
  if (m) return m[1];
  try {
    const parsed = typeof xmlText === 'string' ? JSON.parse(xmlText) : xmlText;
    if (parsed?.response?.doupload?.key) return parsed.response.doupload.key;
    if (parsed?.doupload?.key) return parsed.doupload.key;
  } catch (e) {}
  return null;
}

router.post('/mdfup', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: false, creator: 'Bagus Bahril', message: "File not found. Use form field name 'file'." });
    }

    // build new filename with 3 random digits
    const orig = req.file.originalname || 'file';
    const ext = orig.includes('.') ? orig.split('.').pop() : '';
    const base = orig.replace(/\.[^/.]+$/, '');
    const newName = ext ? `${base}_${rand3()}.${ext}` : `${base}_${rand3()}`;

    // 1) upload init (returns XML/JSON with <key>)
    const initRespRaw = await uploadInit(SESSION_TOKEN, req.file.buffer, newName);

    // 2) extract quick upload key
    const quickKey = extractKeyFromXml(initRespRaw);
    if (!quickKey) {
      return res.status(500).json({
        status: false,
        creator: 'Bagus Bahril',
        message: 'Gagal Boy.'
      });
    }

    // 3) poll upload result
    const pollResp = await pollUpload(SESSION_TOKEN, quickKey);

    const pollData = pollResp?.response?.doupload || pollResp?.doupload || null;
    if (!pollData) {
      return res.status(500).json({
        status: false,
        creator: 'Bagus Bahril',
        message: 'Gagal Boy.',
        raw: pollResp
      });
    }

    const quickkey = pollData.quickkey || pollData.quickKey || pollData.key || quickKey;
    const filename = pollData.filename || newName;
    const created = pollData.created || new Date().toISOString();

    // view & download urls
    const view_url = quickkey ? `https://www.mediafire.com/file/${quickkey}/${encodeURIComponent(filename)}` : `https://www.mediafire.com/file/${quickkey || ''}`;
    const download_url = `${view_url}/file`;

    const uploaded_at = new Date(created).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    return res.json({
      status: true,
      creator: 'Bagus Bahril',
      filename,
      uploaded_at,
      view_url,
      download_url
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      creator: 'Bagus Bahril',
      message: 'Gagal upload ke MediaFire.',
      error: err && err.message ? err.message : String(err)
    });
  }
});

module.exports = router;

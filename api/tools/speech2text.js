const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const stt = {
  api: {
    base: 'https://www.speech-to-text.cloud',
    endpoints: {
      upload: '/athanis/upload',
      transcribe: (fid) => `/athanis/transcribe/${fid}/yyy`
    }
  },

  headers: {
    origin: 'https://www.speech-to-text.cloud',
    referer: 'https://www.speech-to-text.cloud/',
    'user-agent': 'NB Android/1.0.0'
  },

  uploadAudio: async (filePath) => {
    const form = new FormData();
    form.append('audio_file', fs.createReadStream(filePath), {
      filename: path.basename(filePath),
      contentType: 'audio/mpeg'
    });

    const res = await axios.post(
      `${stt.api.base}${stt.api.endpoints.upload}`,
      form,
      { headers: { ...stt.headers, ...form.getHeaders() } }
    );

    return res.data?.fid;
  },

  transcribeAudio: async (fid) => {
    const url = `${stt.api.base}${stt.api.endpoints.transcribe(fid)}`;
    let transcript = '';

    const res = await axios.get(url, {
      headers: { ...stt.headers, accept: '*/*' },
      responseType: 'stream',
      timeout: 0
    });

    await new Promise((resolve, reject) => {
      res.data.on('data', (chunk) => {
        const lines = chunk.toString('utf8').split(/\r?\n/);
        for (const line of lines) {
          if (!line || line.startsWith('#progress#')) continue;
          transcript += line + '\n';
        }
      });
      res.data.on('end', resolve);
      res.data.on('error', reject);
    });

    return transcript.trim() || '🤷🏻';
  }
};

router.get('/speech2text', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      creator: 'Bagus Bahril',
      message: 'Parameter "url" wajib diisi.'
    });
  }

  const tempFile = path.join('./tmp', `audio_${Date.now()}.mp3`);

  try {
    // Download audio dari URL
    const response = await axios.get(url, { responseType: 'stream' });
    const writer = fs.createWriteStream(tempFile);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Upload & transcribe
    const fid = await stt.uploadAudio(tempFile);
    if (!fid) throw new Error('Gagal upload audio.');

    const transcript = await stt.transcribeAudio(fid);

    // Hapus file sementara
    fs.existsSync(tempFile) && fs.unlinkSync(tempFile);

    res.json({
      status: true,
      creator: 'Bagus Bahril',
      transcript
    });
  } catch (err) {
    fs.existsSync(tempFile) && fs.unlinkSync(tempFile);
    res.status(500).json({
      status: false,
      creator: 'Bagus Bahril',
      message: err.message
    });
  }
});

module.exports = router;

const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const cors = require('cors');
const AdmZip = require('adm-zip');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fflate = require('fflate');
const qs = require('qs');
const cheerio = require('cheerio');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types'); 
const { Readable } = require('stream');
const VALID_API_KEYS = ['bagus'];
const upload = multer();
const DOMAIN_CONFIGS = [
  {
    domain: 'your-domain.example',
    vercelToken: 'you-vercel-token',
    cloudflareToken: 'you-cloudflare-token',
    cloudflareZoneId: 'you-zoneid'
  },
  {
    domain: 'your-domain.example',
    vercelToken: 'you-vercel-token',
    cloudflareToken: 'you-cloudflare-token',
    cloudflareZoneId: 'you-zoneid'
  },
  {
    domain: 'your-domain.example',
    vercelToken: 'you-vercel-token',
    cloudflareToken: 'you-cloudflare-token',
    cloudflareZoneId: 'you-zoneid'
  }
];
const randomUid = () => {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};




const app = express();
const PORT = 3000;

app.set('json spaces', 2);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(express.json({ limit: '100mb' }));

app.post('/deploy', upload.single('file'), async (req, res) => {
  try {
    const config = DOMAIN_CONFIGS[Math.floor(Math.random() * DOMAIN_CONFIGS.length)];

    const file = req.file;
    const subdomain = req.body.subdomain.toLowerCase();
    const random = randomUid();
    const projectName = `${subdomain}${random}`;
    const fullDomain = `${subdomain}.${config.domain}`;

    let files = [];

    if (file.originalname.endsWith('.zip')) {
      const zip = new AdmZip(file.buffer);
      const entries = zip.getEntries();

      files = entries
        .filter(e => !e.isDirectory)
        .map(e => ({
          file: e.entryName,
          data: e.getData().toString()
        }));
    } else {
      const ext = path.extname(file.originalname) || '.html';
      files = [{
        file: `index${ext}`,
        data: file.buffer.toString()
      }];
    }

    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: projectName,
        files,
        projectSettings: {
          framework: null,
          buildCommand: null,
          devCommand: null,
          outputDirectory: null
        }
      })
    });

    const deployJson = await deployRes.json();
    if (!deployRes.ok) {
      console.log(deployJson);
      return res.status(400).json({ message: deployJson.error?.message || 'Deploy failed' });
    }

    await fetch(`https://api.vercel.com/v9/projects/${projectName}/domains`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: fullDomain })
    });

    const domainInfo = await (await fetch(`https://api.vercel.com/v9/projects/${projectName}/domains/${fullDomain}`, {
      headers: {
        Authorization: `Bearer ${config.vercelToken}`
      }
    })).json();

    const cnameValue = domainInfo?.verification?.[0]?.value || 'cname.vercel-dns.com';

    await fetch(`https://api.cloudflare.com/client/v4/zones/${config.cloudflareZoneId}/dns_records`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.cloudflareToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'CNAME',
        name: subdomain,
        content: cnameValue,
        ttl: 120,
        proxied: true
      })
    });

    await fetch(`https://api.vercel.com/v9/projects/${projectName}/domains/${fullDomain}/verify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.vercelToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ success: true, fullDomain: `https://${fullDomain}` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

app.get('/api/download/tiktok', async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server berjalan pada http://localhost:${PORT}`);
});

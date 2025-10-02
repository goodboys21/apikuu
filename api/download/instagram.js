const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

function randomIP() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join(".");
}

async function getToken() {
  const res = await fetch("https://gramfetchr.com/", {
    method: "POST",
    headers: {
      "accept": "text/x-component",
      "content-type": "text/plain;charset=UTF-8",
      "next-action": "00d6c3101978ea75ab0e1c4879ef0c686242515660",
      "next-router-state-tree": "%5B%22%22%2C%7B%22children%22%3A%5B%5B%22locale%22%2C%22en%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D%7D%2Cnull%2Cnull%5D",
      "Referer": "https://gramfetchr.com/"
    },
    body: "[]"
  });
  const text = await res.text();
  const tokenMatch = text.match(/"([a-f0-9]{32}:[a-f0-9]{32})"/);
  if (!tokenMatch) throw new Error("Gagal ambil token");
  return tokenMatch[1];
}

async function igScraper(url) {
  const token = await getToken();
  const res = await fetch("https://gramfetchr.com/api/fetchr", {
    method: "POST",
    headers: {
      "accept": "*/*",
      "content-type": "application/json",
      "Referer": "https://gramfetchr.com/"
    },
    body: JSON.stringify({
      url,
      token,
      referer: "https://gramfetchr.com/",
      requester: randomIP()
    })
  });
  const json = await res.json();
  if (!json.success || !json.mediaItems) throw new Error("Gagal ambil data");
  return json.mediaItems.map((m, i) => ({
    index: i + 1,
    type: m.isVideo ? "video" : "image",
    download: "https://gramfetchr.com" + m.downloadLink,
    preview: "https://gramfetchr.com" + m.preview,
    thumbnail: "https://gramfetchr.com" + m.thumbnail
  }));
}

router.get('/instagram', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, message: "Masukkan parameter ?url=" });

  try {
    const results = await igScraper(url);
    return res.json({
      success: true,
      creator: "Bagus Bahril",
      data: results
    });
  } catch (e) {
    console.error("Error Instagram Downloader:", e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;

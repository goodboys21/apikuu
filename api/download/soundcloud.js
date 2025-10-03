/**
 * SoundCloud Downloader (Scrape)
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

// Cache untuk client_id
const cache = { version: "", id: "" };

async function getClientID() {
  try {
    const { data: html } = await axios.get("https://soundcloud.com/");
    const version = html.match(/<script>window\.__sc_version="(\d{10})"<\/script>/)?.[1];
    if (!version) return null;
    if (cache.version === version) return cache.id;

    const scriptMatches = [...html.matchAll(/<script.*?src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+)"/g)];
    for (const [, scriptUrl] of scriptMatches) {
      const { data: js } = await axios.get(scriptUrl);
      const idMatch = js.match(/client_id:"([a-zA-Z0-9]{32})"/);
      if (idMatch) {
        cache.version = version;
        cache.id = idMatch[1];
        return idMatch[1];
      }
    }
  } catch (err) {
    console.error("Gagal ambil client_id:", err.message);
    return null;
  }
}

router.get("/soundcloud", async (req, res) => {
  const { url } = req.query;

  if (!url || !url.includes("soundcloud.com")) {
    return res
      .status(400)
      .json({ status: false, creator: "Bagus Bahril", message: "Link SoundCloud tidak valid." });
  }

  try {
    const client_id = await getClientID();
    if (!client_id) {
      return res
        .status(500)
        .json({ status: false, creator: "Bagus Bahril", message: "Gagal mengambil client_id SoundCloud." });
    }

    const resolveUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(
      url
    )}&client_id=${client_id}`;
    const { data: info } = await axios.get(resolveUrl);

    if (!info.media || !info.media.transcodings) {
      return res
        .status(404)
        .json({ status: false, creator: "Bagus Bahril", message: "Media tidak ditemukan." });
    }

    const streamInfo = info.media.transcodings.find((x) => x.format.protocol === "progressive");
    if (!streamInfo) {
      return res
        .status(400)
        .json({ status: false, creator: "Bagus Bahril", message: "Audio tidak tersedia untuk diunduh." });
    }

    const streamUrl = `${streamInfo.url}?client_id=${client_id}`;
    const { data: streamData } = await axios.get(streamUrl);

    res.json({
      status: true,
      creator: "Bagus Bahril",
      title: info.title || "Unknown",
      artist: info.user?.username || "Unknown",
      artwork: info.artwork_url || null,
      duration: info.duration || null,
      downloadUrl: streamData.url || null,
      original_url: url,
    });
  } catch (err) {
    console.error("SoundCloud Scrape Error:", err.message);
    res
      .status(500)
      .json({ status: false, creator: "Bagus Bahril", message: "Terjadi kesalahan server." });
  }
});

module.exports = router;

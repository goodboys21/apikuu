/**
 * Pinterest Search Scraper
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

class PinterestScraper {
  constructor() {
    this.baseUrl = "https://id.pinterest.com/resource/BaseSearchResource/get/";
    this.headers = {
      "authority": "id.pinterest.com",
      "accept": "application/json, text/javascript, */*, q=0.01",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/x-www-form-urlencoded",
      "origin": "https://id.pinterest.com",
      "referer": "https://id.pinterest.com/",
      "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      "x-app-version": "f1222d7",
      "x-requested-with": "XMLHttpRequest",
    };
  }

  async makeRequest(params, isPost = true) {
    try {
      const url = new URL(this.baseUrl);
      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
      const response = isPost
        ? await axios.post(url.toString(), new URLSearchParams(params).toString(), { headers: this.headers })
        : await axios.get(url.toString(), { headers: this.headers });
      return response.data;
    } catch (err) {
      console.error("Pinterest fetch error:", err.message);
      return null;
    }
  }

  formatResults(items) {
    return items.map((item) => {
      let videoUrl = null;
      if (item.videos?.video_list) {
        const firstVideoKey = Object.keys(item.videos.video_list)[0];
        videoUrl = item.videos.video_list[firstVideoKey]?.url || null;
      }
      return {
        pin: `https://www.pinterest.com/pin/${item.id ?? ""}`,
        id: item.id ?? "",
        type: item.videos ? "video" : item.embed?.type === "gif" ? "gif" : "image",
        image_url: item.images?.orig?.url ?? null,
        video_url: videoUrl,
        description: item.description ?? "",
        pinner: {
          username: item.pinner?.username ?? "",
          full_name: item.pinner?.full_name ?? "",
        },
      };
    });
  }

  async scrape(query, typeFilter = null) {
    const params = { query, _: Date.now() };
    const data = await this.makeRequest(params, false);
    if (!data) return [];
    let results = this.formatResults(data.resource_response?.data?.results || []);
    if (typeFilter) results = results.filter((r) => r.type === typeFilter);
    return results;
  }
}

const scraper = new PinterestScraper();

router.get("/pinterest", async (req, res) => {
  const q = req.query.q?.trim();
  const type = req.query.type || null; // image/video/gif
  if (!q) return res.status(400).json({ status: false, message: "Query parameter 'q' dibutuhkan" });

  try {
    let results = await scraper.scrape(q, type);
    // ambil max 10 random
    results = results.sort(() => 0.5 - Math.random()).slice(0, 10);

    return res.json({
      status: true,
      creator: "Bagus Bahril",
      keyword: q,
      total_results: results.length,
      results,
    });
  } catch (err) {
    console.error("Pinterest error:", err.message);
    return res.status(500).json({ status: false, creator: "Bagus Bahril", message: "Gagal mengambil data Pinterest" });
  }
});

module.exports = router;

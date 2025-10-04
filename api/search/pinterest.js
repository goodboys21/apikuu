const express = require('express');
const axios = require('axios');
const router = express.Router();

// --- Scraper class ---
class PinterestScraper {
  constructor() {
    this.baseUrl = 'https://id.pinterest.com/resource/BaseSearchResource/get/';
    this.headers = {
      "authority": "id.pinterest.com",
      "accept": "application/json, text/javascript, */*, q=0.01",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/x-www-form-urlencoded",
      "origin": "https://id.pinterest.com",
      "referer": "https://id.pinterest.com/",
      "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      "x-requested-with": "XMLHttpRequest",
    };
  }

  async makeRequest(query, bookmark = null) {
    const params = {
      source_url: `/search/pins/?q=${encodeURIComponent(query)}&rs=typed`,
      data: JSON.stringify({
        options: {
          query,
          scope: "pins",
          page_size: 25,
          bookmarks: bookmark ? [bookmark] : [],
        },
        context: {},
      }),
    };

    const url = this.baseUrl + '?' + new URLSearchParams(params).toString();

    try {
      const res = await axios.get(url, { headers: this.headers });
      return res.data;
    } catch (err) {
      throw new Error("Gagal request Pinterest: " + err.message);
    }
  }

  formatResults(results) {
    return results.map(item => {
      let videoUrl = null;
      if (item.videos?.video_list) {
        const firstKey = Object.keys(item.videos.video_list)[0];
        videoUrl = item.videos.video_list[firstKey]?.url || null;
      }

      return {
        pin: `https://www.pinterest.com/pin/${item.id ?? ""}`,
        link: item.link ?? null,
        id: item.id ?? "",
        image_url: item.images?.orig?.url ?? null,
        video_url: videoUrl,
        type: item.videos ? "video" : "image",
        description: item.description ?? "",
        pinner: {
          username: item.pinner?.username ?? "",
          full_name: item.pinner?.full_name ?? "",
          follower_count: item.pinner?.follower_count ?? 0,
          image_small_url: item.pinner?.image_small_url ?? "",
        },
        board: {
          id: item.board?.id ?? "",
          name: item.board?.name ?? "",
          url: item.board?.url ?? "",
          pin_count: item.board?.pin_count ?? 0,
        },
      };
    });
  }

  async scrape(query, type = null) {
    try {
      const firstData = await this.makeRequest(query);
      let results = this.formatResults(firstData.resource_response?.data?.results || []);
      const bookmark = firstData.resource_response?.bookmark;

      if (bookmark) {
        const nextData = await this.makeRequest(query, bookmark);
        if (nextData?.resource_response?.data?.results) {
          const nextResults = this.formatResults(nextData.resource_response.data.results);
          results = results.concat(nextResults);
        }
      }

      if (type) results = results.filter(r => r.type === type);

      return {
        status: true,
        creator: "Bagus Bahril",
        data: results,
        timestamp: new Date().toISOString(),
      };

    } catch (err) {
      return {
        status: false,
        creator: "Bagus Bahril",
        message: err.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// --- Route ---
const scraper = new PinterestScraper();

router.get('/pinterest', async (req, res) => {
  const { query, type } = req.query;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Query parameter wajib diisi."
    });
  }

  if (type && !["image","video","gif"].includes(type.trim().toLowerCase())) {
    return res.status(400).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Type parameter harus 'image', 'video', atau 'gif'."
    });
  }

  const result = await scraper.scrape(query.trim(), type?.trim().toLowerCase() || null);
  res.json(result);
});

module.exports = router;

/**
 * Pinterest Downloader (Scrape)
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

class Pinterest {
  constructor() {
    this.api = {
      base: "https://www.pinterest.com",
      endpoints: {
        pin: "/resource/PinResource/get/",
      },
    };
    this.headers = {
      accept: "application/json, text/javascript, */*, q=0.01",
      referer: "https://www.pinterest.com/",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      "x-app-version": "f1222d7",
      "x-pinterest-appstate": "active",
      "x-pinterest-pws-handler": "www/[username]/[slug].js",
      "x-pinterest-source-url": "/search/pins/?rs=typed&q=xxx/",
      "x-requested-with": "XMLHttpRequest",
    };
    this.client = axios.create({
      baseURL: this.api.base,
      headers: this.headers,
    });
    this.cookies = "";

    this.client.interceptors.response.use(
      (response) => {
        const setCookieHeaders = response.headers["set-cookie"];
        if (setCookieHeaders) {
          const newCookies = setCookieHeaders.map((c) => c.split(";")[0].trim());
          this.cookies = newCookies.join("; ");
          this.client.defaults.headers.cookie = this.cookies;
        }
        return response;
      },
      (error) => Promise.reject(error)
    );
  }

  isUrl(str) {
    try {
      new URL(str);
      return true;
    } catch (_) {
      return false;
    }
  }

  isPin(url) {
    if (!url) return false;
    const patterns = [
      /^https?:\/\/(?:[\w-]+\.)?pinterest\.[\w.]+\/pin\/[\w.-]+/,
      /^https?:\/\/pin\.it\/[\w.-]+/,
      /^https?:\/\/(?:[\w-]+\.)?pinterest\.[\w.]+\/pin\/[\d]+(?:\/)?/,
    ];
    const clean = url.trim().toLowerCase();
    return patterns.some((pattern) => pattern.test(clean));
  }

  async followRedirects(url, maxRedirects = 2) {
    try {
      let currentUrl = url;
      let redirectCount = 0;

      while (redirectCount < maxRedirects) {
        const response = await axios.head(currentUrl, {
          maxRedirects: 0,
          validateStatus: (status) => status < 400 || (status >= 300 && status < 400),
          timeout: 10000,
        });

        if (response.status >= 300 && response.status < 400 && response.headers.location) {
          currentUrl = response.headers.location;
          if (!currentUrl.startsWith("http")) {
            const baseUrl = new URL(url);
            currentUrl = new URL(currentUrl, baseUrl.origin).href;
          }
          redirectCount++;
        } else break;
      }

      return currentUrl;
    } catch (error) {
      return url;
    }
  }

  async initCookies() {
    try {
      await this.client.get("/");
      return true;
    } catch (error) {
      console.error("Failed to initialize cookies:", error.message);
      return false;
    }
  }

  async download(pinUrl) {
    if (!pinUrl || !this.isUrl(pinUrl)) {
      return { status: false, code: 400, result: { message: "Invalid Pinterest URL." } };
    }

    try {
      const finalUrl = await this.followRedirects(pinUrl, 2);
      if (!this.isPin(finalUrl)) {
        return { status: false, code: 400, result: { message: "Not a valid Pinterest pin." } };
      }

      const pinId = finalUrl.split("/pin/")[1]?.split("/")[0]?.split("?")[0];
      if (!pinId) return { status: false, code: 400, result: { message: "Cannot extract pin ID." } };

      if (!this.cookies) {
        const success = await this.initCookies();
        if (!success)
          return { status: false, code: 400, result: { message: "Failed to retrieve cookies." } };
      }

      const params = {
        source_url: `/pin/${pinId}/`,
        data: JSON.stringify({ options: { field_set_key: "detailed", id: pinId }, context: {} }),
        _: Date.now(),
      };

      const { data } = await this.client.get(this.api.endpoints.pin, { params });

      const pd = data.resource_response?.data;
      if (!pd) return { status: false, code: 404, result: { message: "Pin not found." } };

      const mediaUrls = [];

      if (pd.videos?.video_list) {
        const firstVideoKey = Object.keys(pd.videos.video_list)[0];
        let videoUrl = pd.videos.video_list[firstVideoKey]?.url;
        if (videoUrl && firstVideoKey.includes("HLS") && videoUrl.includes("m3u8")) {
          videoUrl = videoUrl.replace("hls", "720p").replace("m3u8", "mp4");
        }
        mediaUrls.push({
          type: "video",
          quality: `${pd.videos.video_list[firstVideoKey].width}x${pd.videos.video_list[firstVideoKey].height}`,
          width: pd.videos.video_list[firstVideoKey].width,
          height: pd.videos.video_list[firstVideoKey].height,
          duration: pd.videos.duration || null,
          url: videoUrl,
          file_size: pd.videos.video_list[firstVideoKey].file_size || null,
          thumbnail: pd.videos.video_list[firstVideoKey].thumbnail || pd.images?.orig?.url,
        });
      }

      if (pd.images) {
        Object.entries(pd.images).forEach(([quality, image]) => {
          if (image?.url) {
            mediaUrls.push({
              type: "image",
              quality,
              width: image.width,
              height: image.height,
              url: image.url,
              size: `${image.width}x${image.height}`,
            });
          }
        });
      }

      if (mediaUrls.length === 0) return { status: false, code: 404, result: { message: "No media found." } };

      return {
        status: true,
        code: 200,
        result: {
          id: pd.id,
          title: pd.title || pd.grid_title || "",
          description: pd.description || "",
          created_at: pd.created_at,
          original_url: pinUrl,
          final_url: finalUrl,
          media_urls: mediaUrls,
        },
      };
    } catch (err) {
      return { status: false, code: 500, result: { message: "Server error." } };
    }
  }
}

const pinterest = new Pinterest();

router.get("/pinterest", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ status: false, creator: "Bagus Bahril", message: "Masukkan parameter ?url=" });

  try {
    const result = await pinterest.download(url);

    // Tambahin creator di bawah status
    const response = {
      status: result.status,
      creator: "Bagus Bahril",
      ...result.result,
    };

    res.status(result.code).json(response);
  } catch (err) {
    res.status(500).json({ status: false, creator: "Bagus Bahril", message: "Terjadi kesalahan server." });
  }
});
module.exports = router;

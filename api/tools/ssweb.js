/**
 * SSWeb - Screenshot Website
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

async function ssweb(url, { width = 1280, height = 720, full_page = false, device_scale = 1 } = {}) {
  if (!url.startsWith("https://")) throw new Error("Invalid url");
  if (isNaN(width) || isNaN(height) || isNaN(device_scale))
    throw new Error("Width, height, and scale must be a number");
  if (typeof full_page !== "boolean")) throw new Error("Full page must be a boolean");

  const { data } = await axios.post(
    "https://gcp.imagy.app/screenshot/createscreenshot",
    {
      url: url,
      browserWidth: parseInt(width),
      browserHeight: parseInt(height),
      fullPage: full_page,
      deviceScaleFactor: parseInt(device_scale),
      format: "png",
    },
    {
      headers: {
        "content-type": "application/json",
        referer: "https://imagy.app/full-page-screenshot-taker/",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
      },
    }
  );

  return data.fileUrl;
}

// Endpoint GET
router.get("/ssweb", async (req, res) => {
  const { url, width, height, full_page, scale } = req.query;
  if (!url) {
    return res.status(400).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Parameter 'url' dibutuhkan",
    });
  }

  try {
    const result = await ssweb(url, {
      width: width ? parseInt(width) : 1280,
      height: height ? parseInt(height) : 720,
      full_page: full_page === "true",
      device_scale: scale ? parseInt(scale) : 1,
    });

    res.json({
      status: true,
      creator: "Bagus Bahril",
      result,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: err.message,
    });
  }
});

module.exports = router;

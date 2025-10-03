/**
 * Remove Background API via URL
 * Creator: Ponta Sensei
 */

const express = require("express");
const axios = require("axios");
const router = express.Router();

async function removeBgFromUrl(imageUrl) {
  try {
    const res = await axios.post(
      "https://removebg.one/api/predict/v2",
      { url: imageUrl },
      {
        headers: {
          accept: "application/json, text/plain, */*",
          locale: "en-US",
          platform: "PC",
          product: "REMOVEBG",
          "sec-ch-ua":
            '"Chromium";v="127", "Not)A;Brand";v="99", "Microsoft Edge Simulate";v="127", "Lemur";v="127"',
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": '"Android"',
          referer: "https://removebg.one/upload",
        },
      }
    );

    const data = res.data?.data;
    return {
      original: data.url,
      cutout: data.cutoutUrl,
      mask: data.maskUrl,
    };
  } catch (e) {
    throw new Error(e.message || "Failed to remove background");
  }
}

// Endpoint GET
router.get("/removebg", async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).json({ status: false, message: "Parameter 'url' dibutuhkan" });

  try {
    const result = await removeBgFromUrl(imageUrl);
    res.json({ status: true, creator: "Ponta Sensei", result });
  } catch (err) {
    res.status(500).json({ status: false, creator: "Ponta Sensei", message: err.message });
  }
});

module.exports = router;

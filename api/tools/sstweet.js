const express = require("express");
const axios = require("axios");

const anj = express.Router();

anj.get("/sstweet", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.json({ status: false, message: "masukin url tweet" });

    const match = url.match(/status\/(\d+)/);
    if (!match) return res.json({ status: false, message: "link salah" });
    const tweetId = match[1];

    const payload = {
      templateSlug: "tweet-image",
      modifications: { tweetUrl: url, tweetId },
      renderType: "images",
      responseFormat: "png",
      responseType: "base64",
      userAPIKey: false,
    };

    const { data } = await axios.post(
      "https://orshot.com/api/templates/make-playground-request",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Origin": "https://orshot.com",
          "Referer": "https://orshot.com/templates/tweet-image/generate",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) Chrome/107.0.0.0 Safari/537.36",
          Accept: "*/*",
        },
      }
    );

    if (!data?.data?.content)
      return res.json({ status: false, message: "gagal ambil gambar" });

    const imageBase64 = data.data.content.replace(
      /^data:image\/png;base64,/,
      ""
    );

    res.json({
      status: true,
      creator: "Bagus Bahril",
      result: {
        base64: `data:image/png;base64,${imageBase64}`,
      },
    });
  } catch (e) {
    res.json({ status: false, message: e.message });
  }
});

module.exports = anj;

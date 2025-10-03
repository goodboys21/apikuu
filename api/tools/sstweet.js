const express = require("express");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

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
          Origin: "https://orshot.com",
          Referer: "https://orshot.com/templates/tweet-image/generate",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) Chrome/107.0.0.0 Safari/537.36",
          Accept: "*/*",
        },
      }
    );

    if (!data?.data?.content)
      return res.json({ status: false, message: "gagal ambil gambar" });

    // ambil base64 → buffer
    const base64Data = data.data.content.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // simpan sementara
    const filePath = "/tmp/result.png";
    fs.writeFileSync(filePath, buffer);

    // upload ke server
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const upload = await axios.post("https://server-jees2.vercel.app/upload", form, {
      headers: form.getHeaders(),
    });

    return res.json({
      status: true,
      creator: "Bagus Bahril",
      result: upload.data,
    });
  } catch (e) {
    res.json({ status: false, message: e.message });
  }
});

module.exports = anj;

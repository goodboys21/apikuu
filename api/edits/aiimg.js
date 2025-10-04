const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const router = express.Router();

router.get("/aiimg", async (req, res) => {
  try {
    const imageUrl = req.query.image;
    const prompt = req.query.prompt || "Turn this into beautiful AI art style";

    if (!imageUrl) {
      return res.json({
        success: false,
        creator: "Bagus Bahril",
        message: "Param 'image' wajib diisi (URL gambar)"
      });
    }

    // 1. Download gambar
    const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(imgRes.data);
    const tmpFile = path.join("/tmp", "aiimg-input.png");
    fs.writeFileSync(tmpFile, buffer);

    // 2. Scrape API Key OverChat
    const { data: html } = await axios.get("https://overchat.ai/image/ghibli", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const match = html.match(/const apiKey = '([^']+)'/);
    if (!match) throw new Error("Gagal ambil API Key!");
    const apiKey = match[1];

    // 3. Edit image via OpenAI Edits
    const form = new FormData();
    form.append("image", fs.createReadStream(tmpFile));
    form.append("prompt", prompt);
    form.append("model", "gpt-image-1");
    form.append("n", 1);
    form.append("size", "1024x1024");
    form.append("quality", "medium");

    const editRes = await axios.post("https://api.openai.com/v1/images/edits", form, {
      headers: { 
        ...form.getHeaders(),
        "Authorization": `Bearer ${apiKey}`
      },
      responseType: "json"
    });

    const imgData = editRes.data.data?.[0]?.b64_json;
    if (!imgData) throw new Error("Gagal generate image");

    // 4. Simpan sementara + upload ke server lo
    const resultBuffer = Buffer.from(imgData, "base64");
    const uploadForm = new FormData();
    uploadForm.append("file", resultBuffer, { filename: "aiimg.png" });

    const uploadRes = await axios.post(
      "https://server-jees2.vercel.app/upload",
      uploadForm,
      { headers: uploadForm.getHeaders() }
    );

    return res.json({
      success: true,
      creator: "Bagus Bahril",
      url: uploadRes.data.url
    });

  } catch (err) {
    console.error(err);
    return res.json({
      success: false,
      creator: "Bagus Bahril",
      message: err.message || "Terjadi error saat generate AI image"
    });
  }
});

module.exports = router;

const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const router = express.Router();

// Fungsi scrape API key
async function scrapeApiKey() {
  try {
    const targetUrl = "https://overchat.ai/image/ghibli";
    const { data: htmlContent } = await axios.get(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    const apiKeyRegex = /const apiKey\s*=\s*'([^']+)'/;
    const match = htmlContent.match(apiKeyRegex);

    if (match && match[1]) return match[1];
    throw new Error("Gagal ambil API Key!");
  } catch (err) {
    console.error("❌ Scrape API Key error:", err.message);
    throw err;
  }
}

// Fungsi generate image via API
async function generateAiImage(filePath, apiKey, prompt) {
  const form = new FormData();
  form.append("image", fs.createReadStream(filePath));
  form.append("prompt", prompt || "Gambar keren dan menarik");
  form.append("model", "gpt-image-1");
  form.append("n", 1);
  form.append("size", "1024x1024");
  form.append("quality", "medium");

  const res = await axios.post("https://api.openai.com/v1/images/edits", form, {
    headers: { 
      ...form.getHeaders(),
      "Authorization": `Bearer ${apiKey}`
    },
    responseType: "json"
  });

  const data = res.data;
  if (data?.data?.[0]?.b64_json) {
    return Buffer.from(data.data[0].b64_json, "base64");
  }
  throw new Error("Gagal generate image, respons API kosong!");
}

// Route Express
router.get("/maker/aiimg", async (req, res) => {
  try {
    const imageUrl = req.query.image;
    const prompt = req.query.prompt || "Gambar keren dan menarik";

    if (!imageUrl) return res.json({
      success: false,
      creator: "Bagus Bahril",
      message: "Param 'image' wajib diisi (URL gambar)"
    });

    // Download gambar
    const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(imgRes.data);
    const tmpFile = path.join("/tmp", "aiimg-input.png");
    fs.writeFileSync(tmpFile, buffer);

    // Ambil API Key otomatis
    const apiKey = await scrapeApiKey();

    // Generate image
    const imageBuffer = await generateAiImage(tmpFile, apiKey, prompt);

    // Simpan sementara dan upload ke server lo
    const outputFile = path.join("/tmp", "aiimg-output.png");
    fs.writeFileSync(outputFile, imageBuffer);

    const uploadForm = new FormData();
    uploadForm.append("file", fs.createReadStream(outputFile), { filename: "aiimg.png" });

    const upload = await axios.post("https://server-jees2.vercel.app/upload", uploadForm, { headers: uploadForm.getHeaders() });

    // Hapus sementara
    fs.unlinkSync(tmpFile);
    fs.unlinkSync(outputFile);

    return res.json({
      success: true,
      creator: "Bagus Bahril",
      prompt,
      url: upload.data.url
    });

  } catch (err) {
    return res.json({
      success: false,
      creator: "Bagus Bahril",
      message: err.message || "Terjadi error saat generate AI Image"
    });
  }
});

module.exports = router;

const express = require("express");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const router = express.Router();

/**
 * Generate image from Pollinations AI
 */
async function generatePollinations(prompt, model = "realistic", opts = {}) {
  const {
    width = 512,
    height = 512,
    seed = Math.floor(Math.random() * 999999),
    nologo = true,
    enhance = true,
    hidewatermark = true,
  } = opts;

  try {
    const query = new URLSearchParams({
      model,
      width,
      height,
      seed,
    });

    if (nologo) query.set("nologo", "true");
    if (enhance) query.set("enhance", "true");
    if (hidewatermark) query.set("hidewatermark", "true");

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt
    )}?${query.toString()}`;

    const res = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(res.data, "binary");
  } catch (err) {
    throw new Error("Gagal generate image: " + err.message);
  }
}

/**
 * Upload ke server-jees2
 */
async function uploadImage(buffer, filename = "result.png") {
  const form = new FormData();
  fs.writeFileSync(filename, buffer);
  form.append("file", fs.createReadStream(filename));

  const { data } = await axios.post(
    "https://server-jees2.vercel.app/upload",
    form,
    { headers: form.getHeaders() }
  );

  fs.unlinkSync(filename); // hapus file sementara
  return data;
}

// Endpoint text2image
router.get("/text2image", async (req, res) => {
  const { text, model, width, height } = req.query;
  if (!text)
    return res.json({ success: false, message: "Parameter text wajib diisi!" });

  try {
    const buffer = await generatePollinations(text, model || "realistic", {
      width: width ? parseInt(width) : 512,
      height: height ? parseInt(height) : 512,
    });

    const uploadResp = await uploadImage(buffer, "result.png");

    res.json({
      success: true,
      creator: "Bagus Bahril",
      text,
      model: model || "realistic",
      result: uploadResp,
    });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

module.exports = router;

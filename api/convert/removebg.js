const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const router = express.Router();

async function removeBg(filePath) {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const res = await axios.post("https://removebg.one/api/predict/v2", form, {
      headers: {
        ...form.getHeaders(),
        "accept": "application/json, text/plain, */*",
        "locale": "en-US",
        "platform": "PC",
        "product": "REMOVEBG",
        "sec-ch-ua":
          '"Chromium";v="127", "Not)A;Brand";v="99", "Microsoft Edge Simulate";v="127", "Lemur";v="127"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        Referer: "https://removebg.one/upload",
      },
    });

    let data = res.data?.data;
    return {
      success: true,
      original: data.url,
      cutout: data.cutoutUrl,
      mask: data.maskUrl,
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

router.get("/removebg", async (req, res) => {
  try {
    const imageUrl = req.query.image;
    if (!imageUrl) {
      return res.json({
        success: false,
        creator: "Bagus Bahril",
        message: "Param 'image' wajib diisi (url gambar)",
      });
    }

    // download gambar dulu
    const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(imgRes.data);
    const tmpFile = path.join("/tmp", "removebg-input.jpg");
    fs.writeFileSync(tmpFile, buffer);

    const result = await removeBg(tmpFile);

    // hapus file tmp
    fs.unlinkSync(tmpFile);

    if (!result.success) {
      return res.json({
        success: false,
        creator: "Bagus Bahril",
        message: result.error || "Gagal proses removebg",
      });
    }

    return res.json({
      success: true,
      creator: "Bagus Bahril",
      original: result.original,
      cutout: result.cutout,
      mask: result.mask,
    });
  } catch (err) {
    return res.json({
      success: false,
      creator: "Bagus Bahril",
      message: err.message || "Terjadi error saat proses removebg",
    });
  }
});

module.exports = router;

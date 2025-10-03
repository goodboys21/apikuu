const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const router = express.Router();

async function removeBgScrape(filePath) {
  try {
    // ambil CSRF token
    const tokenRes = await axios.post("https://www.remove.bg/trust_tokens");
    const match = tokenRes.data.request.match(/useToken\('(.+?)'\)/);
    const csrfToken = match ? match[1] : null;
    if (!csrfToken) throw new Error("Gagal ambil token!");

    // upload gambar
    const form = new FormData();
    form.append("image[upload]", fs.createReadStream(filePath));

    const uploadRes = await axios.post("https://www.remove.bg/images", form, {
      headers: {
        ...form.getHeaders(),
        "x-csrf-token": csrfToken,
        Accept: "application/json",
      },
    });

    const data = uploadRes.data.data[0];
    return {
      success: true,
      id: data.meta.id,
      original: data.original.url, // link file original di remove.bg
      result: data.result?.url || null, // biasanya link hasil bg-removed
      status: data.hd_result?.state || "unknown"
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
        message: "Param 'image' wajib diisi (url gambar)"
      });
    }

    // download dulu ke /tmp
    const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(imgRes.data);
    const tmpFile = path.join("/tmp", "removebg-input.jpg");
    fs.writeFileSync(tmpFile, buffer);

    const result = await removeBgScrape(tmpFile);

    // hapus file tmp
    fs.unlinkSync(tmpFile);

    if (!result.success) {
      return res.json({
        success: false,
        creator: "Bagus Bahril",
        message: result.error || "Gagal proses removebg"
      });
    }

    return res.json({
      success: true,
      creator: "Bagus Bahril",
      id: result.id,
      status: result.status,
      original: result.original,
      result: result.result
    });
  } catch (err) {
    return res.json({
      success: false,
      creator: "Bagus Bahril",
      message: err.message || "Terjadi error saat proses removebg"
    });
  }
});

module.exports = router;

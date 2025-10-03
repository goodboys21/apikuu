const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();
const genAI = new GoogleGenerativeAI("AIzaSyAM_goy_Trmd_lAR5irSDse0oWiOFwjm3Q");

// Endpoint: /api/convert/hytamkan?image=URL
router.get("/hytamkan", async (req, res) => {
  try {
    const imageUrl = req.query.image;
    const prompt = req.query.prompt || "tolong ubah rambutnya jadi ber uban.";

    if (!imageUrl) {
      return res.json({
        success: false,
        creator: "Bagus Bahril",
        message: "Param image tidak boleh kosong"
      });
    }

    // Ambil image buffer
    const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const base64Image = Buffer.from(imgRes.data).toString("base64");

    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/png",
          data: base64Image
        }
      }
    ];

    // Pakai model Gemini image edit
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
      generationConfig: { responseModalities: ["Text", "Image"] }
    });

    const response = await model.generateContent(contents);

    let resultImage;
    for (const part of response.response.candidates[0].content.parts) {
      if (part.inlineData) {
        resultImage = Buffer.from(part.inlineData.data, "base64");
      }
    }

    if (!resultImage) {
      return res.json({
        success: false,
        creator: "Bagus Bahril",
        message: "Gagal generate image"
      });
    }

    // Upload hasil ke server
    const form = new FormData();
    form.append("file", resultImage, { filename: "hytamkan.png" });

    const upload = await axios.post("https://server-jees2.vercel.app/upload", form, {
      headers: form.getHeaders()
    });

    const fileUrl = upload.data?.url || null;

    return res.json({
      success: true,
      creator: "Bagus Bahril",
      result: fileUrl
    });

  } catch (err) {
    console.error(err);
    return res.json({
      success: false,
      creator: "Bagus Bahril",
      message: err.message
    });
  }
});

module.exports = router;

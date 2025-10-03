/**
 * Remini / Unblur Image API
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");

const router = express.Router();

async function unblur(imageUrl) {
  const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const imageBuffer = Buffer.from(imageResponse.data);
  const randomFileName = crypto.randomBytes(8).toString("hex") + ".jpg";

  const form = new FormData();
  form.append("original_image_file", imageBuffer, randomFileName);

  const uploadResponse = await axios.post(
    "https://api.unblurimage.ai/api/imgupscaler/v2/ai-image-unblur/create-job",
    form,
    {
      headers: {
        ...form.getHeaders(),
        "sec-ch-ua-platform": "Android",
        authorization: "",
        "product-serial": "934359e62f07d8d6ab6b09fb162db2c9",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
        "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        "sec-ch-ua-mobile": "?1",
        accept: "*/*",
        origin: "https://unblurimage.ai",
        referer: "https://unblurimage.ai/",
      },
    }
  );

  const jobId = uploadResponse.data.result.job_id;

  let outputUrl = null;
  while (!outputUrl) {
    const response = await axios.get(
      `https://api.unblurimage.ai/api/imgupscaler/v2/ai-image-unblur/get-job/${jobId}`,
      {
        headers: {
          "sec-ch-ua-platform": "Android",
          authorization: "",
          "product-serial": "934359e62f07d8d6ab6b09fb162db2c9",
          "user-agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
          "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
          "sec-ch-ua-mobile": "?1",
          accept: "*/*",
          origin: "https://unblurimage.ai",
          referer: "https://unblurimage.ai/",
        },
      }
    );

    const data = response.data;
    if (data.result && data.result.output_url && data.result.output_url.length > 0) {
      outputUrl = data.result.output_url[0];
    } else {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  return outputUrl;
}

// Endpoint GET
router.get("/remini", async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).json({ status: false, message: "Parameter 'url' dibutuhkan" });

  try {
    const resultUrl = await unblur(imageUrl);
    res.json({ status: true, creator: "Bagus Bahril", result: resultUrl });
  } catch (err) {
    res.status(500).json({ status: false, creator: "Bagus Bahril", message: err.message });
  }
});

module.exports = router;

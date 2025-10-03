/**
 * Image To Sketch API
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");
const https = require("https");
const crypto = require("crypto");
const FormData = require("form-data");

const router = express.Router();

function generateSessionHash() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 11; i++) {
    const byte = crypto.randomBytes(1)[0];
    result += chars[byte % chars.length];
  }
  return result;
}

function getStream(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let buffer = "";
        res.on("data", (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop();
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.replace("data: ", ""));
                if (data.msg === "process_completed" && data.output?.data?.[0]?.url) {
                  resolve(data.output.data[0].url);
                }
              } catch (e) {}
            }
          }
        });
        res.on("end", () => reject("stream ended"));
      })
      .on("error", reject);
  });
}

async function imageToSketch(imageUrl) {
  const sessionHash = generateSessionHash();

  const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });

  const form = new FormData();
  form.append("files", Buffer.from(imageResponse.data), {
    filename: "image.jpg",
    contentType: "image/jpeg",
  });

  const headers = { ...form.getHeaders() };

  const uploadRes = await axios.post(
    "https://raec25-image-to-drawing-sketch.hf.space/gradio_api/upload?upload_id=qcu1l42hpn",
    form,
    { headers }
  );

  const filePath = uploadRes.data[0];

  const payload = {
    data: [
      {
        path: filePath,
        url: `https://raec25-image-to-drawing-sketch.hf.space/gradio_api/file=${filePath}`,
        orig_name: "image.jpg",
        size: imageResponse.data.length,
        mime_type: "image/jpeg",
        meta: { _type: "gradio.FileData" },
      },
      "Pencil Sketch",
    ],
    event_data: null,
    fn_index: 2,
    trigger_id: 13,
    session_hash: sessionHash,
  };

  await axios.post(
    "https://raec25-image-to-drawing-sketch.hf.space/gradio_api/queue/join?__theme=system",
    payload,
    { headers: { "Content-Type": "application/json" } }
  );

  const result = await getStream(
    `https://raec25-image-to-drawing-sketch.hf.space/gradio_api/queue/data?session_hash=${sessionHash}`
  );
  return result;
}

// Endpoint GET
router.get("/tosketch", async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).json({ status: false, message: "Parameter 'url' dibutuhkan" });

  try {
    const sketchUrl = await imageToSketch(imageUrl);
    res.json({ status: true, creator: "Bagus Bahril", result: sketchUrl });
  } catch (err) {
    res.status(500).json({ status: false, creator: "Bagus Bahril", message: err.message });
  }
});

module.exports = router;

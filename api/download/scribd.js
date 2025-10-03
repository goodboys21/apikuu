/**
 * Scribd Downloader
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");
const FormData = require("form-data");

const router = express.Router();

async function scribddl(url) {
  try {
    if (!url.includes("scribd.com")) throw new Error("Invalid url");

    const form = new FormData();
    form.append("action", "scribd_action_slide");
    form.append("code", "download");
    form.append("scribd", `scribd_video_url=${encodeURIComponent(url)}`);

    const { data } = await axios.post(
      "https://scribdownloader.com/wp-admin/admin-ajax.php",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "user-agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
          "x-requested-with": "XMLHttpRequest",
        },
      }
    );

    return data;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Endpoint GET
router.get("/scribd", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Parameter 'url' dibutuhkan",
    });
  }

  try {
    const result = await scribddl(url);
    res.json({
      status: true,
      creator: "Bagus Bahril",
      result,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: err.message,
    });
  }
});

module.exports = router;

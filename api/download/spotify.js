/**
 * Google Drive Downloader (URL Converter)
 * Creator: Bagus Bahril
 */

const express = require("express");
const router = express.Router();

router.get("/gdrive", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res
      .status(400)
      .json({ success: false, message: "Masukkan parameter ?url=" });
  }

  // Extract FILE_ID dari URL
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    return res
      .status(400)
      .json({ success: false, message: "URL GDrive tidak valid" });
  }

  const fileId = match[1];
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  return res.json({
    success: true,
    creator: "Bagus Bahril",
    fileId,
    downloadUrl,
  });
});

module.exports = router;

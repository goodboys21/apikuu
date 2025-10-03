const express = require("express");
const axios = require("axios");

const anj = express.Router();

anj.get("/ppwa", async (req, res) => {
  try {
    const { no } = req.query;
    if (!no) return res.json({ status: false, message: "masukin nomor wa" });
    if (isNaN(no)) return res.json({ status: false, message: "nomor tidak valid" });

    const { data } = await axios.get("https://wa-api.b-cdn.net/wa-dp/", {
      headers: {
        accept: "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        origin: "https://snaplytics.io",
        referer: "https://snaplytics.io/",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
      },
      params: { phone: no },
    });

    return res.json({
      status: true,
      creator: "Bagus Bahril",
      result: data,
    });
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
});

module.exports = anj;

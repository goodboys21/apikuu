/**
 * Douyin Search API
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");
const router = express.Router();

async function douyinSearch(keyword) {
  const url = `https://www.douyin.com/aweme/v1/web/general/search/single/?device_platform=webapp&aid=6383&channel=channel_pc_web&search_channel=aweme_general&enable_history=1&keyword=${encodeURIComponent(keyword)}&search_source=normal_search&query_correct_type=1&is_filter_search=0&offset=0&count=10`;

  const headers = {
    "sec-ch-ua-mobile": "?0",
    "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    "sec-ch-ua-platform": "\"Linux\"",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    "referer": `https://www.douyin.com/root/search/${encodeURIComponent(keyword)}?type=general`,
    "cookie": "__ac_nonce=068984a6900a2b950ffa0; __ac_signature=_02B4Z6wo00f01X5KMRAAAIDD9sh4uxxdKJF-ajWAADcO38; s_v_web_id=verify_me5d6fih_IX6PCIGA_twP0_4zgA_8EqK_cyQRrxomnYdv;"
  };

  const { data } = await axios.get(url, { headers });
  return data;
}

// Endpoint GET
router.get("/douyin", async (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) return res.status(400).json({ status: false, message: "Parameter 'keyword' dibutuhkan" });

  try {
    const result = await douyinSearch(keyword);
    res.json({ status: true, creator: "Bagus Bahril", keyword, result });
  } catch (err) {
    res.status(500).json({ status: false, creator: "Bagus Bahril", message: err.message });
  }
});

module.exports = router;

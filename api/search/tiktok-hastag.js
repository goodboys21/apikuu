const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

router.get("/tthashtag", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ success: false, message: "Parameter q wajib diisi!" });

  try {
    const url = `https://tiktokhashtags.com/hashtag/${q.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}/`;
    const { data } = await axios.get(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    const result = {
      mostPopular: [],
      secondMostLiked: [],
      report: {},
      top10: [],
      related: [],
      trending: [],
    };

    // ambil popular & second
    const mostPopularHashtags = $("p1").text();
    result.mostPopular = mostPopularHashtags.split(" ").filter((r) => r);

    const secondMostLikedHashtags = $("p2").text();
    result.secondMostLiked = secondMostLikedHashtags.split(" ").filter((r) => r);

    // ambil report
    result.report = {
      overallPosts: $(".col-lg-4:nth-child(1) .g-font-size-26").text(),
      overallViews: $(".col-lg-4:nth-child(2) .g-font-size-26").text(),
      viewsPerPost: $(".col-lg-4:nth-child(3) .g-font-size-26").text(),
    };

    // top10
    $("#top10 table tbody tr").each((i, el) => {
      result.top10.push({
        hashtag: $(el).find("td:nth-child(2) a").text(),
        posts: $(el).find("td:nth-child(3)").text(),
        views: $(el).find("td:nth-child(4)").text(),
        postViews: $(el).find("td:nth-child(5) .u-label").text(),
      });
    });

    // related
    $("#related table tbody tr").each((i, el) => {
      result.related.push({
        hashtag: $(el).find("td:nth-child(2) a").text(),
        posts: $(el).find("td:nth-child(3)").text(),
        views: $(el).find("td:nth-child(4)").text(),
        postViews: $(el).find("td:nth-child(5) .u-label").text(),
      });
    });

    // trending
    $("#tranding table tbody tr").each((i, el) => {
      result.trending.push({
        hashtag: $(el).find("td:nth-child(2) a").text(),
        posts: $(el).find("td:nth-child(3)").text(),
        views: $(el).find("td:nth-child(4)").text(),
        postViews: $(el).find("td:nth-child(5) .u-label").text(),
      });
    });

    res.json({ success: true, data: result });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

module.exports = router;

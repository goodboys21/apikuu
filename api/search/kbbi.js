/**
 * KBBI Scraper
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

async function scrapeKbbi(q) {
  try {
    const { data: html } = await axios.get(
      `https://kbbi.kemdikbud.go.id/entri/${encodeURIComponent(q)}`,
      {
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    const $ = cheerio.load(html);
    const isExist = !/tidak ditemukan/i.test(
      $("body > div.container.body-content > h4[style='color:red']").text()
    );

    if (!isExist) return [];

    const results = [];
    let isContent = false;
    let lastTitle = undefined;

    $("body > div.container.body-content")
      .children()
      .each((_, el) => {
        const tag = el.tagName;
        const elem = $(el);

        if (tag === "hr") isContent = !isContent && !results.length;

        if (tag === "h2" && isContent) {
          const indexText = elem.find("sup").text().trim();
          const index = parseInt(indexText) || 0;
          const title = elem.text().trim();
          results.push({ index, title, means: [] });
          lastTitle = title;
        }

        if ((tag === "ol" || tag === "ul") && isContent && lastTitle) {
          elem.find("li").each((_, liEl) => {
            const li = $(liEl).text().trim();
            const idx = results.findIndex(({ title }) => title === lastTitle);
            if (idx !== -1) results[idx].means.push(li);
          });
          lastTitle = undefined;
        }
      });

    return results;
  } catch (error) {
    console.error("KBBI Scraper Error:", error.message);
    return [];
  }
}

router.get("/kbbi", async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.status(400).json({ status: false, message: "Query parameter 'q' dibutuhkan" });

  try {
    const entries = await scrapeKbbi(q);
    if (!entries.length)
      return res.status(404).json({ status: false, creator: "Bagus Bahril", keyword: q, message: "Kata tidak ditemukan" });

    res.json({
      status: true,
      creator: "Bagus Bahril",
      keyword: q,
      total_results: entries.length,
      results: entries,
    });
  } catch (err) {
    console.error("KBBI route error:", err.message);
    res.status(500).json({ status: false, creator: "Bagus Bahril", message: "Gagal mengambil data KBBI" });
  }
});

module.exports = router;

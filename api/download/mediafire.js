const express = require("express");
const { chromium } = require("playwright");

const router = express.Router();

router.get("/mediafire2", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, message: "Masukkan parameter ?url=" });

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-blink-features=AutomationControlled",
        "--no-first-run",
        "--no-default-browser-check",
      ],
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      javaScriptEnabled: true,
      bypassCSP: true,
      ignoreHTTPSErrors: true,
      acceptDownloads: true,
    });

    const page = await context.newPage();

    // Block heavy resources
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (["image", "stylesheet", "font", "media"].includes(type)) route.abort();
      else route.continue();
    });

    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);

    // Scrape data
    const fileInfo = await page.evaluate(() => {
      const getText = (selectors) => {
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el?.textContent?.trim()) return el.textContent.trim();
        }
        return "";
      };

      const getDownloadLink = () => {
        const btn = document.querySelector("#downloadButton, a.input.popsok, a[data-scrambled-url]");
        if (btn?.getAttribute("data-scrambled-url")) {
          try { return atob(btn.getAttribute("data-scrambled-url")); } catch {}
        }
        const fallback = document.querySelector('a[href*="download"], a[aria-label*="Download"]');
        return fallback?.href || null;
      };

      return {
        name: getText([".filename", ".dl-filename", "h1.filename", ".file-title"]),
        size: getText([".details > li:first-child > span", ".file_size", ".dl-info > div:first-child"]),
        description: getText([".description p:not(.description-subheading)"]),
        uploadDate: Array.from(document.querySelectorAll(".details li")).find((li) => li.textContent.includes("Uploaded"))?.querySelector("span")?.textContent || "",
        fileType: getText([".filetype span:first-child"]),
        link: getDownloadLink(),
      };
    });

    await browser.close();

    if (!fileInfo.link) return res.status(422).json({ success: false, message: "Gagal ekstrak direct download" });

    return res.json({ success: true, creator: "Bagus Bahril", file: url, ...fileInfo });
  } catch (err) {
    if (browser) await browser.close();
    console.error("MediaFire scrape error:", err.message);
    return res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
});

module.exports = router;

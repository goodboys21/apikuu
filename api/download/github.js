/**
 * GitHub Downloader (Scrape)
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

class GitHubUrlParser {
  constructor(options = {}) {
    this.headers = {
      "User-Agent": options.userAgent || "github-data-fetcher",
      ...(options.token && { Authorization: `token ${options.token}` }),
    };
  }

  parseUrl(url) {
    const patterns = {
      repo: /https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/)?$/,
      file: /https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/,
      raw: /https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/,
      gist: /https?:\/\/gist\.github\.com\/([^/]+)\/([a-f0-9]+)/,
    };

    for (const [type, regex] of Object.entries(patterns)) {
      const match = url.match(regex);
      if (match) return { type, match };
    }

    throw new Error(
      "URL tidak valid. Format yang didukung: repo, file, raw, atau gist URL GitHub"
    );
  }

  async getRepoData(user, repo) {
    const apiUrl = `https://api.github.com/repos/${user}/${repo}`;
    const response = await axios.get(apiUrl, { headers: this.headers, timeout: 30000 });
    const { default_branch, description, stargazers_count, forks_count, topics } = response.data;

    return {
      type: "repository",
      owner: user,
      repo,
      description,
      default_branch,
      stars: stargazers_count,
      forks: forks_count,
      topics,
      download_url: `https://github.com/${user}/${repo}/archive/refs/heads/${default_branch}.zip`,
      clone_url: `https://github.com/${user}/${repo}.git`,
      api_url: apiUrl,
    };
  }

  async getFileData(user, repo, branch, path) {
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${path}?ref=${branch}`;
    const response = await axios.get(apiUrl, { headers: this.headers, timeout: 30000 });

    return {
      type: "file",
      owner: user,
      repo,
      branch,
      path,
      name: response.data.name,
      size: response.data.size,
      raw_url: response.data.download_url,
      content: Buffer.from(response.data.content, "base64").toString(),
      sha: response.data.sha,
      api_url: apiUrl,
    };
  }

  async getGistData(user, gistId) {
    const apiUrl = `https://api.github.com/gists/${gistId}`;
    const response = await axios.get(apiUrl, { headers: this.headers, timeout: 30000 });
    const files = Object.entries(response.data.files).map(([filename, file]) => ({
      name: filename,
      language: file.language,
      raw_url: file.raw_url,
      size: file.size,
      content: file.content,
    }));

    return {
      type: "gist",
      owner: user,
      gist_id: gistId,
      description: response.data.description,
      files,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      comments: response.data.comments,
      api_url: apiUrl,
    };
  }

  async getData(url) {
    const { type, match } = this.parseUrl(url);

    switch (type) {
      case "repo":
        return await this.getRepoData(match[1], match[2]);
      case "file":
        return await this.getFileData(match[1], match[2], match[3], match[4]);
      case "gist":
        return await this.getGistData(match[1], match[2]);
      default:
        throw new Error("Format URL tidak didukung");
    }
  }
}

const github = new GitHubUrlParser();

router.get("/github", async (req, res) => {
  const url = req.query.url?.trim();
  if (!url) {
    return res.status(400).json({ status: false, creator: "Bagus Bahril", message: "URL parameter is required" });
  }

  try {
    const data = await github.getData(url);
    res.json({
      status: true,
      creator: "Bagus Bahril",
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      creator: "Bagus Bahril",
      message: err.message || "Internal Server Error",
    });
  }
});

module.exports = router;

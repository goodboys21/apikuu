/**
 * GitHub User Scraper
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/github", async (req, res) => {
  const username = req.query.username?.trim();

  if (!username) {
    return res.status(400).json({
      status: false,
      creator: "Bagus Bahril",
      message: "Username parameter is required",
    });
  }

  try {
    const { data } = await axios.get(`https://api.github.com/users/${username}`, {
      headers: {
        "User-Agent": "github-scraper-bagus",
      },
      timeout: 30000,
    });

    const result = {
      status: true,
      creator: "Bagus Bahril",
      username: data.login || null,
      nickname: data.name || null,
      bio: data.bio || null,
      id: data.id || null,
      nodeId: data.node_id || null,
      profile_pic: data.avatar_url || null,
      url: data.html_url || null,
      type: data.type || null,
      admin: data.site_admin || false,
      company: data.company || null,
      blog: data.blog || null,
      location: data.location || null,
      email: data.email || null,
      public_repo: data.public_repos || 0,
      public_gists: data.public_gists || 0,
      followers: data.followers || 0,
      following: data.following || 0,
      created_at: data.created_at || null,
      updated_at: data.updated_at || null,
    };

    return res.json(result);
  } catch (error) {
    return res.status(404).json({
      status: false,
      creator: "Bagus Bahril",
      message: "User not found or API error",
    });
  }
});

module.exports = router;

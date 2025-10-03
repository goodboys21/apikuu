const express = require("express");
const axios = require("axios");

const router = express.Router();

async function pinterestStalk(username, cookies = "") {
  if (!username) throw new Error("Username cannot be empty");

  const baseURL = "https://www.pinterest.com";
  const headers = {
    accept: "application/json, text/javascript, */*; q=0.01",
    referer: "https://www.pinterest.com/",
    "user-agent": "Postify/1.0.0",
    "x-app-version": "xxx",
    "x-pinterest-appstate": "active",
    "x-pinterest-pws-handler": `www/${username}/[slug].js`,
    "x-pinterest-source-url": `/${username}/`,
    "x-requested-with": "XMLHttpRequest",
    cookie: cookies,
  };

  const client = axios.create({ baseURL, headers });

  // Ambil cookies jika belum ada
  if (!cookies) {
    try {
      const res = await client.get("/");
      const setCookies = res.headers["set-cookie"];
      if (setCookies) {
        cookies = setCookies.map((c) => c.split(";")[0].trim()).join("; ");
        client.defaults.headers.cookie = cookies;
      }
    } catch (err) {
      throw new Error("Failed to initialize cookies");
    }
  }

  try {
    const params = {
      source_url: `/${username}/`,
      data: JSON.stringify({
        options: { username, field_set_key: "profile", isPrefetch: false },
        context: {},
      }),
      _: Date.now(),
    };

    const { data } = await client.get("/resource/UserResource/get/", { params });

    if (!data.resource_response?.data) throw new Error("User not found");

    const userx = data.resource_response.data;

    return {
      id: userx.id,
      username: userx.username,
      full_name: userx.full_name || "",
      bio: userx.about || "",
      profile_url: `https://pinterest.com/${userx.username}`,
      stats: {
        pins: userx.pin_count || 0,
        followers: userx.follower_count || 0,
        following: userx.following_count || 0,
        boards: userx.board_count || 0,
        likes: userx.like_count || 0,
      },
      image: {
        small: userx.image_small_url || null,
        medium: userx.image_medium_url || null,
        large: userx.image_large_url || null,
        original: userx.image_xlarge_url || null,
      },
      website: userx.website_url || null,
      social_links: {
        twitter: userx.twitter_url || null,
        facebook: userx.facebook_url || null,
        instagram: userx.instagram_url || null,
      },
      meta: {
        first_name: userx.first_name || null,
        last_name: userx.last_name || null,
        locale: userx.locale || null,
        gender: userx.gender || null,
      },
    };
  } catch (err) {
    throw new Error(err.message || "Server error. Please try again later.");
  }
}

// Endpoint Express
router.get("/pinterest", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ status: false, message: "Parameter 'username' dibutuhkan" });

  try {
    const userInfo = await pinterestStalk(username);
    res.json({ status: true, creator: "Bagus Bahril", user: userInfo });
  } catch (err) {
    res.status(500).json({ status: false, creator: "Bagus Bahril", message: err.message });
  }
});

module.exports = router;

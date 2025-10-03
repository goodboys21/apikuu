/**
 * Roblox Stalker
 * Creator: Bagus Bahril
 */

const express = require("express");
const axios = require("axios");

const router = express.Router();

const proxy: () => string | null;

class RobloxAPI {
  constructor() {
    this.baseUrl = "https://api.roblox.com";
  }

  async request(url, method = "GET", data = null, timeout = 10000) {
    try {
      const config = { method, url, timeout };
      if (data) config.data = data;
      const response = await axios(config);
      return response.data;
    } catch {
      return null;
    }
  }

  async getUserIdFromUsername(username) {
    const data = await this.request(
      proxy() + "https://users.roblox.com/v1/usernames/users",
      "POST",
      { usernames: [username], excludeBannedUsers: false }
    );
    return data?.data?.[0]?.id || null;
  }

  async getUserInfo(userId) {
    return await this.request(`https://users.roblox.com/v1/users/${userId}`);
  }

  async getUserStatus(userId) {
    return await this.request(`https://users.roblox.com/v1/users/${userId}/status`);
  }

  async getUserPresence(userIds) {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    return await this.request(proxy() + "https://presence.roblox.com/v1/presence/users", "POST", { userIds: ids });
  }

  async getUserFriendsCount(userId) {
    return await this.request(`https://friends.roblox.com/v1/users/${userId}/friends/count`);
  }

  async getUserFollowersCount(userId) {
    return await this.request(`https://friends.roblox.com/v1/users/${userId}/followers/count`);
  }

  async getUserFollowingCount(userId) {
    return await this.request(`https://friends.roblox.com/v1/users/${userId}/followings/count`);
  }

  async getCompleteUserInfo(username) {
    const userId = await this.getUserIdFromUsername(username);
    if (!userId) return null;

    const [basic, status, presence, friends, followers, following] = await Promise.all([
      this.getUserInfo(userId),
      this.getUserStatus(userId),
      this.getUserPresence([userId]),
      this.getUserFriendsCount(userId),
      this.getUserFollowersCount(userId),
      this.getUserFollowingCount(userId),
    ]);

    return {
      userId,
      basic,
      status,
      presence,
      social: { friends, followers, following },
    };
  }
}

const Roblox = new RobloxAPI();

router.get("/roblox", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ status: false, message: "Parameter 'username' dibutuhkan" });

  try {
    const data = await Roblox.getCompleteUserInfo(username);
    if (!data) return res.status(404).json({ status: false, message: "User Roblox tidak ditemukan" });
    res.json({ status: true, creator: "Bagus Bahril", user: data });
  } catch (err) {
    res.status(500).json({ status: false, creator: "Bagus Bahril", message: err.message });
  }
});

module.exports = router;

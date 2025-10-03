const express = require("express");
const axios = require("axios");
const FormData = require("form-data");

const router = express.Router();

const aiLabs = {
  api: {
    base: "https://text2video.aritek.app",
    endpoints: {
      generate: "/txt2videov3",
      video: "/video"
    }
  },

  headers: {
    "user-agent": "NB Android/1.0.0",
    "accept-encoding": "gzip",
    "content-type": "application/json",
    authorization: ""
  },

  state: { token: null },

  setup: {
    cipher: "hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW",
    shiftValue: 3,
    dec(text, shift) {
      return [...text].map(c =>
        /[a-z]/.test(c)
          ? String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97)
          : /[A-Z]/.test(c)
          ? String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65)
          : c
      ).join("");
    },
    decrypt: async () => {
      if (aiLabs.state.token) return aiLabs.state.token;
      const decrypted = aiLabs.setup.dec(aiLabs.setup.cipher, aiLabs.setup.shiftValue);
      aiLabs.state.token = decrypted;
      aiLabs.headers.authorization = decrypted;
      return decrypted;
    }
  },

  deviceId() {
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  },

  generate: async (prompt) => {
    if (!prompt?.trim()) {
      return { success: false, creator: "Bagus Bahril", message: "Prompt kosong bree 🗿" };
    }

    await aiLabs.setup.decrypt();
    const payload = {
      deviceID: aiLabs.deviceId(),
      isPremium: 1,
      prompt,
      used: [],
      versionCode: 59
    };

    try {
      const url = aiLabs.api.base + aiLabs.api.endpoints.generate;
      const res = await axios.post(url, payload, { headers: aiLabs.headers });
      const { code, key } = res.data;

      if (code !== 0 || !key) {
        return { success: false, creator: "Bagus Bahril", message: "Gagal ambil key video bree 😂" };
      }
      return await aiLabs.video(key, prompt);
    } catch (err) {
      return { success: false, creator: "Bagus Bahril", message: err.message };
    }
  },

  video: async (key, prompt) => {
    await aiLabs.setup.decrypt();
    const payload = { keys: [key] };
    const url = aiLabs.api.base + aiLabs.api.endpoints.video;

    let attempt = 0, maxAttempts = 50, delay = 3000;
    while (attempt < maxAttempts) {
      attempt++;
      try {
        const res = await axios.post(url, payload, { headers: aiLabs.headers });
        const { code, datas } = res.data;

        if (code === 0 && Array.isArray(datas) && datas[0]?.url) {
          return {
            success: true,
            creator: "Bagus Bahril",
            url: datas[0].url.trim(),
            key,
            prompt
          };
        }

        await new Promise(r => setTimeout(r, delay));
      } catch {
        await new Promise(r => setTimeout(r, delay));
      }
    }
    return { success: false, creator: "Bagus Bahril", message: "Kelamaan bree, video gagal jadi 😭" };
  }
};

router.get("/text2video", async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.json({ success: false, creator: "Bagus Bahril", message: "Masukin prompt dulu bree 🗿" });
  }

  try {
    const result = await aiLabs.generate(prompt);
    if (!result.success) return res.json(result);

    // Download video ke buffer langsung
    const videoRes = await axios.get(result.url, { responseType: "arraybuffer" });

    // Upload ke server
    const form = new FormData();
    form.append("file", Buffer.from(videoRes.data), { filename: "result.mp4" });
    const upload = await axios.post("https://server-jees2.vercel.app/upload", form, {
      headers: form.getHeaders()
    });

    res.json({
      success: true,
      creator: "Bagus Bahril",
      prompt,
      video: upload.data
    });
  } catch (e) {
    res.json({ success: false, creator: "Bagus Bahril", message: e.message });
  }
});

module.exports = router;

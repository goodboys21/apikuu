const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Konfigurasi Ghibli
const ghibli = {
  api: {
    base: "https://api.code12.cloud",
    endpoints: {
      paygate: (slug) => `/app/paygate-oauth${slug}`,
      ghibli: (slug) => `/app/v2/ghibli/user-image${slug}`,
    },
  },

  creds: {
    appId: "DKTECH_GHIBLI_Dktechinc",
    secretKey: "r0R5EKF4seRwqUIB8gLPdFvNmPm8rN63",
  },

  studios: [
    "ghibli-howl-moving-castle-anime",
    "ghibli-spirited-away-anime",
    "ghibli-my-neighbor-totoro-anime",
    "ghibli-ponyo-anime",
    "ghibli-grave-of-fireflies-anime",
    "ghibli-princess-mononoke-anime",
    "ghibli-kaguya-anime",
  ],

  db: "./db.json",

  readDB: () => {
    try {
      return JSON.parse(fs.readFileSync(ghibli.db, "utf-8"));
    } catch {
      return null;
    }
  },

  writeDB: (data) =>
    fs.writeFileSync(ghibli.db, JSON.stringify(data, null, 2), "utf-8"),

  getStudioId: (id) => {
    if (typeof id === "number" && ghibli.studios[id]) return ghibli.studios[id];
    if (typeof id === "string" && ghibli.studios.includes(id)) return id;
    return null;
  },

  getNewToken: async () => {
    const url = `${ghibli.api.base}${ghibli.api.endpoints.paygate("/token")}`;
    const res = await axios.post(
      url,
      {
        appId: ghibli.creds.appId,
        secretKey: ghibli.creds.secretKey,
      },
      {
        headers: { "content-type": "application/json" },
        validateStatus: () => true,
      }
    );
    if (res.status !== 200 || res.data?.status?.code !== "200") {
      return { success: false, result: { error: "Gagal ambil token" } };
    }
    const { token, tokenExpire, encryptionKey } = res.data.data;
    ghibli.writeDB({ token, tokenExpire, encryptionKey });
    return { success: true, result: { token } };
  },

  getToken: async () => {
    const db = ghibli.readDB();
    const now = Date.now();
    if (db && db.token && db.tokenExpire && now < db.tokenExpire) {
      return { success: true, result: db };
    }
    return await ghibli.getNewToken();
  },

  generate: async ({ studio, filePath }) => {
    const studioId = ghibli.getStudioId(studio);
    if (!studioId) {
      return { success: false, result: { error: "Studio tidak valid" } };
    }
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, result: { error: "File tidak ditemukan" } };
    }

    const toket = await ghibli.getToken();
    if (!toket.success) return toket;

    const { token } = toket.result;
    const form = new FormData();
    form.append("studio", studioId);
    form.append("file", fs.createReadStream(filePath));

    const url = `${ghibli.api.base}${ghibli.api.endpoints.ghibli(
      "/edit-theme"
    )}?uuid=1212`;

    const res = await axios.post(url, form, {
      headers: { ...form.getHeaders(), authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });

    if (res.status !== 200 || res.data?.status?.code !== "200") {
      return {
        success: false,
        result: { error: res.data?.status?.message || "Gagal generate" },
      };
    }

    return {
      success: true,
      result: {
        imageUrl: res.data.data.imageUrl,
      },
    };
  },
};

// Endpoint utama
router.get("/maker/toghibli", async (req, res) => {
  try {
    const imageUrl = req.query.image;
    const studio = req.query.studio || 0;

    if (!imageUrl) {
      return res.json({
        success: false,
        creator: "Bagus Bahril",
        message: "Param 'image' wajib diisi (url gambar)",
      });
    }

    // Download gambar ke /tmp
    const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(imgRes.data);
    const tmpFile = path.join("/tmp", "ghibli-input.jpg");
    fs.writeFileSync(tmpFile, buffer);

    // Generate Ghibli
    const result = await ghibli.generate({ studio, filePath: tmpFile });
    if (!result.success) {
      return res.json({
        success: false,
        creator: "Bagus Bahril",
        message: result.result.error,
      });
    }

    // Upload hasil ke server lo
    const uploadForm = new FormData();
    const imgBuffer = await axios.get(result.result.imageUrl, {
      responseType: "arraybuffer",
    });
    uploadForm.append("file", Buffer.from(imgBuffer.data), {
      filename: "ghibli.png",
    });

    const upload = await axios.post(
      "https://server-jees2.vercel.app/upload",
      uploadForm,
      { headers: uploadForm.getHeaders() }
    );

    return res.json({
      success: true,
      creator: "Bagus Bahril",
      studio: ghibli.getStudioId(studio),
      url: upload.data.url,
    });
  } catch (err) {
    res.json({
      success: false,
      creator: "Bagus Bahril",
      message: err.message || "Terjadi error saat proses Ghibli",
    });
  }
});

module.exports = router;

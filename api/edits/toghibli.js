const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// =====================
// GHIBLI ENGINE
// =====================
let tokenCache = null; // simpan token di memory

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

  headers: {
    "user-agent": "NB Android/1.0.0",
    "accept-encoding": "gzip",
  },

  getStudioId: (id) => {
    if (typeof id === "number" && ghibli.studios[id]) return ghibli.studios[id];
    if (typeof id === "string" && ghibli.studios.includes(id)) return id;
    return ghibli.studios[0]; // default ke index 0
  },

  getNewToken: async () => {
    try {
      const url = `${ghibli.api.base}${ghibli.api.endpoints.paygate("/token")}`;

      const res = await axios.post(
        url,
        {
          appId: ghibli.creds.appId,
          secretKey: ghibli.creds.secretKey,
        },
        {
          headers: {
            ...ghibli.headers,
            "content-type": "application/json",
          },
          validateStatus: () => true,
        }
      );

      if (res.status !== 200 || res.data?.status?.code !== "200") {
        return {
          success: false,
          code: res.status || 500,
          result: {
            error:
              res.data?.status?.message || "Gagal ambil tokennya bree 😂",
          },
        };
      }

      const { token, tokenExpire, encryptionKey } = res.data.data;
      tokenCache = { token, tokenExpire, encryptionKey };

      return { success: true, code: 200, result: tokenCache };
    } catch (err) {
      return {
        success: false,
        code: err?.response?.status || 500,
        result: { error: err.message },
      };
    }
  },

  getToken: async () => {
    const now = Date.now();
    if (tokenCache && tokenCache.token && now < tokenCache.tokenExpire) {
      return { success: true, code: 200, result: tokenCache };
    }
    return await ghibli.getNewToken();
  },

  generate: async ({ studio, filePath }) => {
    const studioId = ghibli.getStudioId(studio);

    if (!filePath || filePath.trim() === "" || !fs.existsSync(filePath)) {
      return {
        success: false,
        code: 400,
        result: { error: "Imagenya kagak boleh kosong 🗿" },
      };
    }

    try {
      const toket = await ghibli.getToken();
      if (!toket.success) return toket;

      const { token } = toket.result;

      const form = new FormData();
      form.append("studio", studioId);
      form.append("file", fs.createReadStream(filePath), {
        filename: filePath.split("/").pop(),
        contentType: "image/jpeg",
      });

      const url = `${ghibli.api.base}${ghibli.api.endpoints.ghibli(
        "/edit-theme"
      )}?uuid=1212`;

      const res = await axios.post(url, form, {
        headers: {
          ...form.getHeaders(),
          ...ghibli.headers,
          authorization: `Bearer ${token}`,
        },
        validateStatus: () => true,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (res.status !== 200 || res.data?.status?.code !== "200") {
        return {
          success: false,
          code: res.status || 500,
          result: {
            error:
              res.data?.status?.message ||
              res.data?.message ||
              `${res.status}`,
          },
        };
      }

      const { imageId, imageUrl, imageOriginalLink } = res.data.data;
      return {
        success: true,
        code: 200,
        result: { imageId, imageUrl, imageOriginalLink },
      };
    } catch (err) {
      return {
        success: false,
        code: err?.response?.status || 500,
        result: { error: err.message },
      };
    }
  },
};

// =====================
// ROUTER
// =====================
router.get("/toghibli", async (req, res) => {
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

    // Download gambar
    const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(imgRes.data);
    const tmpFile = path.join("/tmp", "ghibli-input.jpg");
    fs.writeFileSync(tmpFile, buffer);

    // Generate via ghibli API
    const result = await ghibli.generate({
      studio,
      filePath: tmpFile,
    });

    if (!result.success) {
      return res.json({
        success: false,
        creator: "Bagus Bahril",
        message: result.result.error || "Gagal generate Ghibli style",
      });
    }

    // Upload hasil ke server
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

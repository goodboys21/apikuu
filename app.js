const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

// === CONFIG TELEGRAM ===
const OWNER_ID = "7081489041"; // ganti sama id mu
const BOT_TOKEN = "7779359135:AAEetQfjXCKGTJury0ps2T3eNwezsEQPpB8"; // token bot mu

// Fungsi kirim notif ke owner
async function sendNotifToOwner(success, endpoint, ip, errorMsg = null) {
  try {
    let text;
    if (success) {
      text = `[✅] ${endpoint}\n${ip}`;
    } else {
      text = `[❌] ${errorMsg}\n${ip}`;
    }

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: OWNER_ID,
      text,
    });
  } catch (err) {
    console.error("❌ Gagal kirim notif Telegram:", err.message);
  }
}

app.set('json spaces', 2);
app.use(express.json());
app.use(cors());

// Middleware buat log + notif
app.use((req, res, next) => {
  const endpoint = req.originalUrl;
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection.remoteAddress ||
    "Unknown";

  // Pasang listener response
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      // ✅ sukses
      sendNotifToOwner(true, endpoint, ip);
    } else {
      // ❌ error
      sendNotifToOwner(false, endpoint, ip, `Status ${res.statusCode}`);
    }
  });

  next();
});

// auto load route dari folder api
const apiPath = path.join(__dirname, 'api');
fs.readdirSync(apiPath).forEach(folder => {
  const folderPath = path.join(apiPath, folder);
  if (fs.lstatSync(folderPath).isDirectory()) {
    fs.readdirSync(folderPath).forEach(file => {
      if (file.endsWith('.js')) {
        const route = require(path.join(folderPath, file));
        if (typeof route === 'function') {
          app.use(`/api/${folder}`, route);  // ✅ auto-load
        } else {
          console.error(`❌ ${file} tidak meng-export router`);
        }
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan pada http://localhost:${PORT}`);
});

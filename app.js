const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.set('json spaces', 2);
app.use(express.json());
app.use(cors());

// auto load route dari folder api
const apiPath = path.join(__dirname, 'api');
fs.readdirSync(apiPath).forEach(folder => {
  const folderPath = path.join(apiPath, folder);
  if (fs.lstatSync(folderPath).isDirectory()) {
    fs.readdirSync(folderPath).forEach(file => {
      if (file.endsWith('.js')) {
        const route = require(path.join(folderPath, file));
        if (typeof route === 'function') {
          app.use(`/api/${folder}`, route);  // ✅ harus function (router)
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

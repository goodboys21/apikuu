const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.set('json spaces', 2);
app.use(express.json());
app.use(cors());

// auto load semua route di folder api
const apiPath = path.join(__dirname, 'api');
fs.readdirSync(apiPath).forEach(folder => {
  const folderPath = path.join(apiPath, folder);
  if (fs.lstatSync(folderPath).isDirectory()) {
    fs.readdirSync(folderPath).forEach(file => {
      if (file.endsWith('.js')) {
        const route = require(path.join(folderPath, file));
        app.use(`/api/${folder}`, route);
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan pada http://localhost:${PORT}`);
});

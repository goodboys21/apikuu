const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/web2app', async (req, res) => {
  const { url, name, email } = req.query;

  if (!url || !name || !email) {
    return res.json({
      success: false,
      creator: 'Bagus Bahril',
      message: 'Parameter url, name, dan email wajib diisi.'
    });
  }

  try {
    // Step 1: request build
    const buildRes = await axios.post('https://standalone-app-api.appmaker.xyz/webapp/build', {
      url,
      email
    });
    const appId = buildRes.data?.body?.appId;
    if (!appId) throw new Error('Gagal membuat build.');

    // Step 2: set config default
    const config = {
      appId,
      appIcon: 'https://raw.githubusercontent.com/codegood21/file/refs/heads/main/h6g3ve.png', // ikon default
      appName: name,
      isPaymentInProgress: false,
      enableShowToolBar: false,
      toolbarColor: '#03A9F4',
      toolbarTitleColor: '#FFFFFF',
      splashIcon: 'https://raw.githubusercontent.com/codegood21/file/refs/heads/main/h6g3ve.png'
    };
    await axios.post('https://standalone-app-api.appmaker.xyz/webapp/build/build', config);

    // Step 3: cek status sampai sukses
    let status = '';
    while (status !== 'success') {
      const statusRes = await axios.get(`https://standalone-app-api.appmaker.xyz/webapp/build/status?appId=${appId}`);
      status = statusRes.data?.body?.status;
      if (status !== 'success') await new Promise(r => setTimeout(r, 5000));
    }

    // Step 4: ambil link download
    const downloadRes = await axios.get(`https://standalone-app-api.appmaker.xyz/webapp/complete/download?appId=${appId}`);
    const downloadLink = downloadRes.data?.body?.buildFile;

    res.json({
      success: true,
      creator: 'Bagus Bahril',
      appName: name,
      download: downloadLink
    });

  } catch (err) {
    res.json({
      success: false,
      creator: 'Bagus Bahril',
      message: err.message
    });
  }
});

module.exports = router;

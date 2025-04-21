const express = require('express');
const { generatePDF } = require('../services/pool/pdfService');

const router = express.Router();

router.post('/generate-pdf', async (req, res) => {
  try {
    const { filename, filePath } = await generatePDF(req.body);
    res.json({ message: 'PDF berhasil dibuat', filename, filePath });
  } catch (err) {
    res.status(500).json({ message: 'Gagal membuat PDF', error: err.message });
  }
});

module.exports = router;

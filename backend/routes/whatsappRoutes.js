const express = require('express');
const { getQRCode, getLogs, sendPdf, sendWa } = require('../services/pool/whatsappServices');

const router = express.Router();

router.post('/send-wa', sendWa);
router.get('/qr', getQRCode);
router.get('/logs', getLogs);
router.get('/send-pdf', sendPdf);

module.exports = router;

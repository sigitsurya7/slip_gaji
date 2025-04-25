const express = require('express');
const { getQRCode, getLogs, sendPdf, sendWa, logoutWa } = require('../services/pool/whatsappServices');

const router = express.Router();

router.post('/send-wa', sendWa);
router.get('/qr', getQRCode);
router.get('/logs', getLogs);
router.post('/send-pdf', sendPdf);
router.get('/logout', logoutWa);

module.exports = router;

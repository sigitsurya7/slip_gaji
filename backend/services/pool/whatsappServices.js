const fs = require('fs');
const path = require('path');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const os = require('os');
const { getChromePath } = require('../hooks/chrome');

// Ganti path untuk runtime dan autentikasi
const runtimeDir = path.join(os.tmpdir(), 'kwala_sender_runtime');
const authDir = path.join(runtimeDir, '.wwebjs_auth');
const reportDir = path.join(runtimeDir, 'report');
const slipsDir = path.join(runtimeDir, 'slips');
if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

const logPath = path.join(reportDir, 'log.json');
if (!fs.existsSync(logPath)) {
  fs.writeFileSync(logPath, JSON.stringify([], null, 2), 'utf8');
  console.log('File log.json dibuat.');
}

if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

let qrCodeData = null;

const chromePath = getChromePath();
let client;

// Inisialisasi client WhatsApp
const initializeClient = (shouldInitialize) => {
  if (!shouldInitialize) {
    console.log('❌ WhatsApp client NOT initialized. Cutoff date has passed.');
    return;
  }
  client = new Client({
    authStrategy: new LocalAuth({
      clientId: 'slip-gaji',
      dataPath: authDir
    }),
    puppeteer: {
      headless: true,
      executablePath: chromePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', (qr) => {
    qrCodeData = qr;
    console.log('ke update')
  });

  client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
  });

  client.on('authenticated', () => {
    console.log('WhatsApp authenticated');
  });

  client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
  });

  client.initialize();
};

// Fungsi untuk generate QR code
const getQRCode = async (req, res) => {
    try {
        if (client.info && client.info.pushname) {
            return res.status(200).json({ message: 'Sudah terautentikasi' });
        }

        if (!qrCodeData) {
            return res.status(500).json({ message: 'Client belum diinisialisasi.' });
        }

        const qrImage = await qrcode.toDataURL(qrCodeData);
        return res.status(200).json({ qr: qrImage });
    } catch (err) {
        return res.status(500).json({ message: 'Error generating QR code.', error: err.message });
    }
};

const getLogs = async (req, res) => {
    const logPath = path.join(reportDir, 'log.json');

    fs.readFile(logPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Gagal membaca file log.', error: err.message });
    }

    try {
      const logs = JSON.parse(data);
      return res.status(200).json(logs);
    } catch (parseErr) {
      return res.status(500).json({ message: 'Gagal parse isi file JSON.', error: parseErr.message });
    }
  });
};

const sendWa = async (req, res) => {
    const { to, message } = req.body;

    const logPath = path.join(reportDir, 'log.json');
    const logEntry = {
        to,
        message,
        status: '',
        timestamp: new Date().toISOString()
    };

    try {
        await sendMessage(to, message);
        logEntry.status = 'success';
        res.status(200).json({ message: 'Pesan berhasil dikirim.' });
    } catch (err) {
        logEntry.status = 'failed';
        logEntry.error = err.message;
        res.status(500).json({ message: 'Gagal mengirim pesan.', error: err.message });
    } finally{
        fs.readFile(logPath, 'utf8', (err, data) => {
        let logs = [];
        if (!err && data) {
        try {
            logs = JSON.parse(data);
        } catch (e) {
            console.error('Gagal parse log JSON:', e.message);
        }
        }

        logs.push(logEntry);

        fs.writeFile(logPath, JSON.stringify(logs, null, 2), 'utf8', err => {
            if (err) console.error('Gagal menyimpan log:', err.message);
        });
    });
    }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const sendPdf = async (req, res) => {
    try {
        const { nama, nomor } = req.body;
        const filename = `${nama.replace(/\s+/g, "_")}_slip_gaji.pdf`;
        const filePath = path.join(slipsDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File tidak ditemukan' });
        }

        const media = MessageMedia.fromFilePath(filePath);
        const phoneWithSuffix = nomor.includes('@c.us') ? nomor : nomor + '@c.us';

        const salamPembuka = `Halo ${nama}, ini dari bagian keuangan. Mohon izin kirim slip gaji bulan ini ya 🙏`
        await client.sendMessage(phoneWithSuffix, salamPembuka)

        await sleep(4000)

        await client.sendMessage(phoneWithSuffix, media);
        return res.json({ message: 'Slip gaji berhasil dikirim ke WhatsApp!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Gagal mengirim WhatsApp', error: err.message });
    }
}

// Fungsi untuk kirim pesan
const sendMessage = async (phoneNumber, message) => {
  const phoneWithSuffix = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
  await client.sendMessage(phoneWithSuffix, message);
};

module.exports = { initializeClient, getQRCode, sendWa, getLogs, sendPdf };

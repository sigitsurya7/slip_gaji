// require('dotenv').config();
const express = require('express');
const cors = require('cors');
const whatsappRoutes = require('./routes/whatsappRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const { initializeClient } = require('./services/pool/whatsappServices');
const { decrypt } = require('./utils/encryption');

const app = express();
app.use(cors());
app.use(express.json());



const encryptedLicense = 'e0f8ec009ee4141185638a5a1ca7ecc6039f4ab78e7adadb74d98cfcc25845e4bcb5aee26520a5d065c6ac98b2e1e00c66a4635b5717e2f1b778e41585b9736a67bf9db0a2f2d869ca993f46f09a6ff7';
let isBeforeCutoff = false;
let decryptedUser = {};

try {
  const decrypted = decrypt(encryptedLicense);
  const parts = decrypted.split(',').reduce((acc, item) => {
    const [key, value] = item.trim().split(':');
    acc[key.toLowerCase()] = value.trim();
    return acc;
  }, {});

  decryptedUser = {
    username: parts['username'],
    password: parts['password'],
    nama: parts['nama'],
    active: parts['active'] === 'true',
  };

  const activeMatch = decrypted.match(/Active:\s*(true|false)/i);
  isBeforeCutoff = activeMatch ? activeMatch[1] === 'true' : false;
} catch (err) {
  console.error('❌ Failed to decrypt license:', err.message);
  isBeforeCutoff = false;
}

app.use((req, res, next) => {

  const allowedPaths = ['/api/kwala_has'];

  // Kalau sebelum 25 April ATAU route-nya adalah pendaftaran, lanjut
  if (isBeforeCutoff || allowedPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  return res.status(403).json({ message: 'Akses trial sudah habis, Silakan hubungi admin.' });
});

// Route pendaftaran (simulasi route yang dibolehkan)
app.use('/api/kwala_has', (req, res) => {
  res.json({ message: 'Route pendaftaran berhasil diakses.' });
});

// Route lainnya (terproteksi setelah 25 April)
app.use('/api/whatsapp', whatsappRoutes)
app.use('/api/pdf', pdfRoutes)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!decryptedUser.active) {
    return res.status(403).json({
      message: '❌ Masa trial sudah berakhir.',
      success: false,
    });
  }

  if (
    username === decryptedUser.username &&
    password === decryptedUser.password
  ) {
    return res.status(200).json({
      message: `✅ Login berhasil. Selamat datang, ${decryptedUser.nama}!`,
      success: true,
      user: {
        nama: decryptedUser.nama,
        username: decryptedUser.username,
      }
    });
  }

  return res.status(401).json({
    message: '❌ Username atau password salah.',
    success: false,
  });
});


// Inisialisasi WhatsApp client
initializeClient(isBeforeCutoff);

const port = 3001;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

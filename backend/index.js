// require('dotenv').config();
const express = require('express');
const cors = require('cors');
const whatsappRoutes = require('./routes/whatsappRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const { initializeClient } = require('./services/pool/whatsappServices');
const { decrypt } = require('./utils/encryption');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const app = express();
app.use(cors());
app.use(express.json());

// Global variables
let isLicenseValid = false;
let decryptedUser = {};
let licenseExpired = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// License configuration
const LICENSE_FILE = 'license.lic';
const runtimeDir = path.join(os.tmpdir(), 'kwala_sender_runtime');
const keyDir = path.join(runtimeDir, 'key');
const licensePath = path.join(keyDir, LICENSE_FILE);

// Initialize license check
(async () => {
  try {
    // Setup directories
    if (!fs.existsSync(runtimeDir)) fs.mkdirSync(runtimeDir);
    if (!fs.existsSync(keyDir)) fs.mkdirSync(keyDir);

    // Check existing license
    if (fs.existsSync(licensePath)) {
      const result = processLicense(licensePath);
      isLicenseValid = result.valid;
      decryptedUser = result.user;
      licenseExpired = result.expired;
    }

    // If no valid license found
    if (!isLicenseValid) {
      console.log(licenseExpired ? '⚠️ License telah kadaluarsa' : '⚠️ License tidak valid/tidak ditemukan');
      await updateLicense();
      const newLicense = processLicense(licensePath);
      isLicenseValid = newLicense.valid;
      decryptedUser = newLicense.user;
      
      if (!isLicenseValid) {
        throw new Error('License tidak valid');
      }
    }

    console.log('✅ License valid:', decryptedUser.expiry);
    startServer();

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    rl.close();
  }
})();

function processLicense(licensePath) {
  try {
    const encryptedLicense = fs.readFileSync(licensePath, 'utf-8').trim();
    if (!encryptedLicense) throw new Error('License file kosong');

    const decrypted = decrypt(encryptedLicense);
    const parts = decrypted.split(',').reduce((acc, item) => {
      const [key, value] = item.trim().split(':').map(s => s.trim());
      if (key && value) acc[key.toLowerCase()] = value;
      return acc;
    }, {});

    // Validate required fields
    const requiredFields = ['username', 'password', 'nama', 'active', 'expiry'];
    for (const field of requiredFields) {
      if (!parts[field]) throw new Error(`Field ${field} tidak ditemukan`);
    }

    const userData = {
      username: parts['username'],
      password: parts['password'],
      nama: parts['nama'],
      active: parts['active'] === 'true',
      expiry: parts['expiry'] == 'lifetime' ? 'Lifetime' : new Date(parts['expiry'])
    };

    const expired = userData.expiry == 'lifetime' ? true : userData.expiry < new Date();
    const valid = userData.active && !expired;

    return {
      valid,
      expired,
      user: userData
    };
  } catch (err) {
    console.error('❌ Gagal memproses license:', err.message);
    return { valid: false, expired: false, user: null };
  }
}

async function updateLicense() {
  return new Promise((resolve) => {
    rl.question('Masukkan license key baru: ', (answer) => {
      try {
        fs.writeFileSync(licensePath, answer.trim(), 'utf8');
        console.log('✅ License berhasil diperbarui');
        resolve(true);
      } catch (err) {
        console.error('❌ Gagal menyimpan license:', err.message);
        resolve(false);
      }
    });
  });
}

function startServer() {
  // Middleware untuk pengecekan license
  app.use((req, res, next) => {
    const allowedPaths = ['/api/kwala_has'];
    
    if (isLicenseValid || allowedPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    return res.status(403).json({ 
      message: licenseExpired 
        ? 'Masa aktif license telah habis, silakan perbarui license.' 
        : 'Akses trial sudah habis, silakan hubungi admin.' 
    });
  });

  // Route pendaftaran (simulasi route yang dibolehkan)
  app.use('/api/kwala_has', (req, res) => {
    res.json({ message: 'Route pendaftaran berhasil diakses.' });
  });

  // Route lainnya (terproteksi)
  app.use('/api/whatsapp', whatsappRoutes);
  app.use('/api/pdf', pdfRoutes);
  
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!isLicenseValid) {
      return res.status(403).json({
        message: licenseExpired 
          ? '❌ Masa aktif license telah habis, silakan perbarui.' 
          : '❌ License tidak valid.',
        success: false,
      });
    }

    if (username === decryptedUser.username && password === decryptedUser.password) {
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
  initializeClient(isLicenseValid);

  const port = 3001;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const app = express();
const angkaTerbilang = require('@develoka/angka-terbilang-js')
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');

app.use(cors());
app.use(express.json());

const port = 5000;

let qrCodeData = null;
let client;

// Pastikan folder slips sudah ada
const slipsDir = path.join(__dirname, 'slips');
if (!fs.existsSync(slipsDir)) {
  fs.mkdirSync(slipsDir);
}

// Terbilang fungsi sederhana
function terbilang(angka) {
  return angkaTerbilang(angka) + ' Rupiah';
}

const rupiah = (number)=>{
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR"
  }).format(number);
}

const getCurrentDate = () => {
  const today = new Date();
  
  const day = today.getDate();  // Tanggal (1-31)
  const month = today.getMonth() + 1;  // Bulan (0-11), ditambah 1 agar sesuai (1-12)
  const year = today.getFullYear();  // Tahun (YYYY)

  return `${day}-${month}-${year}`;
};

app.post('/generate-pdf', async (req, res) => {
  try {
    const data = req.body;
    const htmlTemplate = fs.readFileSync(path.join(__dirname, 'templates/slip.html'), 'utf8');

    function renderRows(rows) {
      return rows.map(row => `
        <tr>
          <td>${row.nama}</td>
          <td class="text-right">${rupiah(row.jumlah)}</td>
        </tr>
      `).join('');
    }
    
    function sumJumlah(rows) {
      return rows.reduce((total, row) => total + row.jumlah, 0);
    }
    
    function sumJumlah(rows) {
      return rows.reduce((total, row) => total + row.jumlah, 0);
    }

    const pendapatanRows = renderRows(data.pendapatan || []);
    const potonganRows = renderRows(data.potongan || []);

    const totalPendapatan = sumJumlah(data.pendapatan || []);
    const totalPotongan = sumJumlah(data.potongan || []);


    const html = htmlTemplate
      .replace('{{nama}}', data.dataDiri.nama)
      .replace('{{nik}}', data.dataDiri.nik)
      .replace('{{npwp}}', data.dataDiri.npwp)
      .replace('{{jabatan}}', data.dataDiri.jabatan)
      .replace('{{gaji_bersih}}', rupiah(data.gaji_bersih))
      .replace('{{terbilang}}', terbilang(data.gaji_bersih))
      .replace('{{pendapatan_rows}}', pendapatanRows)
      .replace('{{potongan_rows}}', potonganRows)
      .replace('{{total_pendapatan}}', rupiah(totalPendapatan))
      .replace('{{total_potongan}}', rupiah(totalPotongan))
      .replace('{{alamat}}', data.profile.alamat)
      .replace('{{kota}}', data.profile.kota)
      .replace('{{nama_bendahara}}', data.profile.nama_bendahara)
      .replace('{{nama_perusahaan}}', data.profile.nama_perusahaan)
      .replace('{{periode}}', data.profile.periode)
      .replace('{{tanggal}}', getCurrentDate())


    const browser = await puppeteer.launch({
      headless: "new", // opsional untuk versi Puppeteer terbaru
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A5',
      printBackground: true,
      landscape: true,
    });

    await browser.close();

    const filename = `${data.dataDiri.nama.replace(/\s+/g, "_")}_slip_gaji.pdf`;
    const filePath = path.join(__dirname, 'slips', filename);
    fs.writeFileSync(filePath, pdfBuffer);

    res.json({ message: 'PDF berhasil dibuat', filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan saat generate PDF' });
  }
});

app.get('/qr', async (req, res) => {
    if (client.info && client.info.pushname) {
        return res.status(200).json({ message: 'Sudah terautentikasi' });
    }

    if (!qrCodeData) {
        return res.status(500).json({ message: 'Client belum diinisialisasi.' });
    }

    try {
        const qrImage = await qrcode.toDataURL(qrCodeData);
        res.status(200).json({ qr: qrImage });
    } catch (err) {
        res.status(500).json({ message: 'Error generating QR code.', error: err.message });
    }
});

client = new Client({
  authStrategy: new LocalAuth({ clientId: 'slip-gaji' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  qrCodeData = qr;
  console.log('QR RECEIVED', qr);
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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.post('/send-pdf', async (req, res) => {
  try {
    const { nama, nomor } = req.body;
    const filename = `${nama.replace(/\s+/g, "_")}_slip_gaji.pdf`;
    const filePath = path.join(__dirname, 'slips', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File tidak ditemukan' });
    }

    const media = MessageMedia.fromFilePath(filePath);
    const phoneWithSuffix = nomor.includes('@c.us') ? nomor : nomor + '@c.us';

    const salamPembuka = `Halo ${nama}, ini dari bagian keuangan. Mohon izin kirim slip gaji bulan ini ya 🙏`
    await client.sendMessage(phoneWithSuffix, salamPembuka)

    await sleep(4000)

    await client.sendMessage(phoneWithSuffix, media);
    res.json({ message: 'Slip gaji berhasil dikirim ke WhatsApp!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengirim WhatsApp', error: err.message });
  }
});

app.post('/logout', async (req, res) => {
    try {
        await client.logout(); // Logout dari WhatsApp
        fs.rmSync('./.wwebjs_auth', { recursive: true, force: true }); // Hapus folder penyimpanan sesi
        qrCodeData = null;
        console.log('Autentikasi telah dihapus.');
        res.status(200).json({ message: 'Autentikasi berhasil dihapus.' });
    } catch (err) {
        res.status(500).json({ message: 'Gagal menghapus autentikasi.', error: err.message });
    }
});

app.post('/send-wa', async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ message: 'Nomor tujuan dan pesan harus disediakan.' });
  }

  const logPath = path.join(__dirname, 'report', 'log.json');
  const logEntry = {
    to,
    message,
    status: '',
    timestamp: new Date().toISOString()
  };

  try {
    await client.sendMessage(`${to}@c.us`, message);
    logEntry.status = 'success';
    res.status(200).json({ message: 'Pesan berhasil dikirim.' });
  } catch (err) {
    logEntry.status = 'failed';
    logEntry.error = err.message;
    res.status(500).json({ message: 'Gagal mengirim pesan.', error: err.message });
  } finally {
    // Update log JSON
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
});

app.get('/logs', (req, res) => {
  const logPath = path.join(__dirname, 'report', 'log.json');

  fs.readFile(logPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Gagal membaca file log.', error: err.message });
    }

    try {
      const logs = JSON.parse(data);
      res.status(200).json(logs);
    } catch (parseErr) {
      res.status(500).json({ message: 'Gagal parse isi file JSON.', error: parseErr.message });
    }
  });
});

client.initialize();

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
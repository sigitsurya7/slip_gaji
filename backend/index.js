const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const app = express();
const angkaTerbilang = require('@develoka/angka-terbilang-js')

app.use(cors());
app.use(express.json());

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
      .replace('{{periode}}', data.periode)
      .replace('{{tanggal}}', data.tanggal)
      .replace('{{gaji_bersih}}', rupiah(data.gaji_bersih))
      .replace('{{terbilang}}', terbilang(data.gaji_bersih))
      .replace('{{pendapatan_rows}}', pendapatanRows)
      .replace('{{potongan_rows}}', potonganRows)
      .replace('{{total_pendapatan}}', rupiah(totalPendapatan))
      .replace('{{total_potongan}}', rupiah(totalPotongan));


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

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
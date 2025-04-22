const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const angkaTerbilang = require('@develoka/angka-terbilang-js');
const os = require('os');

const runtimeDir = path.join(os.tmpdir(), 'kwala_sender_runtime');
const slipsDir = path.join(runtimeDir, 'slips');
if (!fs.existsSync(slipsDir)) fs.mkdirSync(slipsDir, { recursive: true });
// Fungsi untuk terbilang
const terbilang = (angka) => {
  return angkaTerbilang(angka) + ' Rupiah';
};

// Fungsi untuk format rupiah
const rupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR"
  }).format(number);
};

// Fungsi untuk generate slip gaji PDF
const generatePDF = async (data) => {
  try {
    const htmlTemplate = fs.readFileSync(path.join(__dirname, '../../templates/slip.html'), 'utf8');
    
    const renderRows = (rows) => {
      return rows.map(row => `
        <tr>
          <td>${row.nama}</td>
          <td class="text-right">${rupiah(row.jumlah)}</td>
        </tr>
      `).join('');
    };

    const sumJumlah = (rows) => rows.reduce((total, row) => total + row.jumlah, 0);

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
      .replace('{{tanggal}}', new Date().toLocaleDateString());

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({ format: 'A5', printBackground: true, landscape: true });

    await browser.close();

    const filename = `${data.dataDiri.nama.replace(/\s+/g, "_")}_slip_gaji.pdf`;
    const filePath = path.join(slipsDir, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    return { success: true, filename, filePath };
  } catch (error) {
    return { success: false, message: 'Terjadi kesalahan saat generate PDF' };
  }
};

module.exports = { generatePDF };

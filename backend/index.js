const express = require('express');
const cors = require('cors');
const whatsappRoutes = require('./routes/whatsappRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const { initializeClient } = require('./services/pool/whatsappServices');

const app = express();

app.use(cors());
app.use(express.json());

// Routing
// app.use('/api/kwala_has') <-- aku ingin membuat routes ini menjadi penanganan, jadi user wajib mendaftar dahulu. baru bisa menjalankan routes dibawahnya
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/pdf', pdfRoutes);

// Initialize WhatsApp client
initializeClient();

const port = 3001;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

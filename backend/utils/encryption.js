const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const secretKey = crypto.createHash('sha256').update('KoalaCreativeIndonesia').digest(); // ganti sesuai kebutuhan
const iv = Buffer.alloc(16, 0); // inisialisasi IV tetap (untuk kemudahan testing)

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };

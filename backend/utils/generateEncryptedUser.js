// utils/generateEncryptedUser.js
const { encrypt } = require('./encryption');

const cutoff = new Date('2025-04-26T00:00:00');
const now = new Date();
const isBeforeCutoff = now < cutoff;

const userData = {
  username: 'trialuser',
  password: 'testing123',
  nama: 'Trial Version',
  typeAccount: 'trial',
  active: isBeforeCutoff
};

const userString = `Username: ${userData.username}, Password: ${userData.password}, Nama: ${userData.nama}, Active: ${userData.active}`;
const encrypted = encrypt(userString);

console.log('🔐 Encrypted string for .env:\n', encrypted);

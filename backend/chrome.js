const fs = require('fs');
const path = require('path');

function getChromePath() {
  const paths = [
    // Windows 64-bit default install
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    // Windows 32-bit
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    // Windows user-local install
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error('Chrome.exe not found in standard locations.');
}

module.exports = { getChromePath };

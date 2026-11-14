const http = require('http');

const urls = [
  '/admin/warga',
  '/admin/kas',
  '/admin/closing',
  '/admin/ronda',
  '/admin/kerja-bakti',
  '/admin/surat'
];

async function checkAll() {
  for (const path of urls) {
    await new Promise((resolve) => {
      http.get(`http://localhost:3000${path}`, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          console.log(`[OK] ${path} -> Status ${res.statusCode}, Sidebar contains Surat Menyurat: ${body.includes('Surat Menyurat')}`);
          resolve();
        });
      }).on('error', (e) => {
        console.error(`[ERR] ${path} ->`, e.message);
        resolve();
      });
    });
  }
}

checkAll();

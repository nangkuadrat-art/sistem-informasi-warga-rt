const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, length: data.length }));
    }).on('error', reject);
  });
}

async function main() {
  const routes = [
    '/admin/closing',
    '/admin/closing?periode=periode-sep-2026',
    '/admin/closing?periode=periode-okt-2026',
    '/admin/kas',
    '/admin/warga',
    '/admin/surat',
    '/admin/kerja-bakti',
    '/admin/ronda'
  ];

  for (const r of routes) {
    try {
      const res = await fetchUrl('http://localhost:3000' + r);
      console.log(`Route ${r.padEnd(40)} -> HTTP ${res.statusCode} (${res.length} bytes)`);
    } catch (e) {
      console.error(`Route ${r.padEnd(40)} -> ERROR: ${e.message}`);
    }
  }
}

main();

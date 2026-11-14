const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'src/lib/data/db_surat.json');
console.log('Exists:', fs.existsSync(dbPath));
if (fs.existsSync(dbPath)) {
  const d = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  console.log('Surat count:', d.length);
  d.forEach((s, idx) => {
    console.log(`[${idx+1}] (${s.jenis}) ${s.nomor_surat} - ${s.perihal}`);
  });
}

const https = require('https');
const fs = require('fs');
const xlsx = require('xlsx');

const sheetUrl = 'https://docs.google.com/spreadsheets/d/1jyxyn4NiqiS2eQa7mY6QAxdG4ajWt6xqfVqHRuBouUg/export?format=xlsx';
const dest = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14_check.xlsx';

function download(url, cb) {
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return download(res.headers.location, cb);
    }
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => file.close(cb));
  }).on('error', (err) => console.error('Download error:', err));
}

download(sheetUrl, () => {
  const wb = xlsx.readFile(dest);
  const oktSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });
  console.log('=== HEADER ROW 24 & 25 (0-idx 23 & 24) ===');
  console.log('Row 24:', oktSheet[23]);
  console.log('Row 25:', oktSheet[24]);
  console.log('=== OKTOBER ROWS WITH DENDA RONDA / KB ===');
  for (let i = 25; i <= 80; i++) {
    const r = oktSheet[i];
    if (!r) continue;
    if ((Number(r[4]) || 0) > 0 || (Number(r[5]) || 0) > 0 || (Number(r[6]) || 0) > 0) {
      console.log(`Unit ${r[0]} (${r[1]} - ${r[2]}): col4=${r[4]}, col5=${r[5]}, col6=${r[6]}, total=${r[9]}`);
    }
  }
  console.log('=== ROW 81 (TOTAL) ===');
  console.log(oktSheet[80]);
  console.log(oktSheet[81]);
});

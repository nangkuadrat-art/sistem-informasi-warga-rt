const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);

const sepSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS SEPTEMBER 2026'], { header: 1 });

console.log('=== HEADER ROWS ===');
for (let i = 20; i <= 26; i++) {
  console.log(`[Row ${i}]`, JSON.stringify(sepSheet[i]));
}

console.log('=== TOTAL / FOOTER ROWS ===');
for (let i = 79; i <= 85; i++) {
  console.log(`[Row ${i}]`, JSON.stringify(sepSheet[i]));
}

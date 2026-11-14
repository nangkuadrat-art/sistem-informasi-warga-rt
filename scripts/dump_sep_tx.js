const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);
const sepSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS SEPTEMBER 2026'], { header: 1 });

console.log('=== KAS SEPTEMBER 2026 MUTASI (ROWS 0-22) ===');
for (let i = 0; i <= 22; i++) {
  if (sepSheet[i] && sepSheet[i].length > 0) {
    console.log(`[Row ${i}]`, JSON.stringify(sepSheet[i]));
  }
}

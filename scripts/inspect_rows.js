const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);
const sepSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS SEPTEMBER 2026'], { header: 1 });

for (let i = 24; i <= 81; i++) {
  const r = sepSheet[i];
  if (r && (r[0] === 32 || r[0] === 52 || r[0] === 18 || i === 81)) {
    console.log(`[Row ${i}]`, JSON.stringify(r));
  }
}

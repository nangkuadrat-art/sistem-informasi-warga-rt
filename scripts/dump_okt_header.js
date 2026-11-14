const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);
const oktSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });

for (let i = 23; i <= 26; i++) {
  console.log(`[Row ${i}]`, JSON.stringify(oktSheet[i]));
}
console.log(`[Row 81]`, JSON.stringify(oktSheet[81]));

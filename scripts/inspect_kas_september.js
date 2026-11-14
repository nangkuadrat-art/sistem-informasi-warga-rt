const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);

const sepSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS SEPTEMBER 2026'], { header: 1 });
console.log('Total rows in KAS SEPTEMBER 2026:', sepSheet.length);

for (let i = 0; i < Math.min(sepSheet.length, 85); i++) {
  const r = sepSheet[i];
  if (r && r.length > 0) {
    console.log(`Row ${i}:`, JSON.stringify(r.slice(0, 12)));
  }
}

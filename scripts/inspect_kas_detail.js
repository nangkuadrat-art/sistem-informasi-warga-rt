const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);
const kasSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });

console.log('Total rows in KAS OKTOBER 2026:', kasSheet.length);
for (let i = 0; i < kasSheet.length; i++) {
  const r = kasSheet[i];
  if (r && r.length > 0) {
    console.log(`Row ${i}:`, JSON.stringify(r.slice(0, 10)));
  }
}

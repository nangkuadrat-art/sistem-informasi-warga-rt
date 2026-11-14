const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);

console.log('--- AKUN SHEET SAMPLE ---');
const akunSheet = xlsx.utils.sheet_to_json(wb.Sheets['AKUN'], { header: 1 });
akunSheet.slice(0, 10).forEach((r, idx) => console.log(idx, JSON.stringify(r)));

console.log('--- KAS OKTOBER 2026 SAMPLE ---');
const kasSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });
kasSheet.slice(0, 15).forEach((r, idx) => console.log(idx, JSON.stringify(r)));

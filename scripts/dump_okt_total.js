const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);
const oktSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });

console.log('Row 23:', JSON.stringify(oktSheet[23]));
console.log('Row 24:', JSON.stringify(oktSheet[24]));
console.log('Row 81:', JSON.stringify(oktSheet[81]));

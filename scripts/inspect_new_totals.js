const xlsx = require('xlsx');

const wb = xlsx.readFile('C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14_latest.xlsx');
const sepSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS SEPTEMBER 2026'], { header: 1 });
const oktSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });

console.log('=== KAS SEPTEMBER 2026 TOTALS ===');
console.log('Row 0:', sepSheet[0]);
console.log('Row 1:', sepSheet[1]);
console.log('Row 20:', sepSheet[20]);
console.log('Row 21:', sepSheet[21]);
console.log('Row 24:', sepSheet[24]);
console.log('Row 57 (Unit 33):', sepSheet[57]);
console.log('Row 81 (TOTAL):', sepSheet[81]);

console.log('\n=== KAS OKTOBER 2026 TOTALS ===');
console.log('Row 0:', oktSheet[0]);
console.log('Row 1:', oktSheet[1]);
console.log('Row 20:', oktSheet[20]);
console.log('Row 21:', oktSheet[21]);
console.log('Row 24:', oktSheet[24]);
console.log('Row 57 (Unit 33):', oktSheet[57]);
console.log('Row 81 (TOTAL):', oktSheet[81]);

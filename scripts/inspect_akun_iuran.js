const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);

console.log('--- ALL AKUN ROWS ---');
const akunSheet = xlsx.utils.sheet_to_json(wb.Sheets['AKUN'], { header: 1 });
for (let i = 6; i < akunSheet.length; i++) {
  const r = akunSheet[i];
  if (!r || !r[0]) continue;
  console.log(`Unit ${r[0]}: Alamat=${r[1]}, KK=${r[2]}, User=${r[3]}, Pengurus=${r[4]}, Pass=${r[5]}, Status=${r[6]}`);
}

console.log('--- IURAN BULANAN ROWS ---');
const iuranSheet = xlsx.utils.sheet_to_json(wb.Sheets['IURAN BULANAN'], { header: 1 });
for (let i = 0; i < 15; i++) {
  console.log(i, JSON.stringify(iuranSheet[i]));
}

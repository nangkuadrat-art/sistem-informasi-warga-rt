const xlsx = require('xlsx');

function excelSerialToDate(serial) {
  if (!serial || typeof serial !== 'number') return null;
  // Excel base date is Dec 30, 1899 due to 1900 leap year bug
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

console.log('33919 ->', excelSerialToDate(33919));

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);
const rekapSheet = xlsx.utils.sheet_to_json(wb.Sheets['REKAP ANGGOTA KELUARGA'], { header: 1 });

for (let i = 5; i < 20; i++) {
  const r = rekapSheet[i];
  if (!r) continue;
  const serial = r[8];
  console.log(`Nama: ${r[4]}, Hub: ${r[5]}, Serial: ${serial}, Date: ${excelSerialToDate(serial)}, Usia: ${r[9]}, Kat: ${r[10]}`);
}

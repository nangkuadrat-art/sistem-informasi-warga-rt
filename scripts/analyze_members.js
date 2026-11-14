const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);

const rekapSheet = xlsx.utils.sheet_to_json(wb.Sheets['REKAP ANGGOTA KELUARGA'], { header: 1 });
console.log('Total rows in REKAP:', rekapSheet.length);

const members = [];
for (let i = 5; i < rekapSheet.length; i++) {
  const row = rekapSheet[i];
  if (!row || row.length === 0 || !row[0]) continue;
  members.push({
    no: row[0],
    blok: row[1],
    noRumah: row[2],
    keluarga: row[3],
    nama: row[4],
    hubungan: row[5],
    jk: row[6],
    tempatLahir: row[7],
    tglLahirSerial: row[8],
    usiaText: row[9],
    kategori: row[10],
    statusNikah: row[11],
    noHp: row[12]
  });
}

console.log('Parsed valid members count:', members.length);
console.log('Unique families in REKAP:', [...new Set(members.map(m => `${m.blok}/${m.noRumah} (${m.keluarga})`))]);
console.log('Sample 3 members:', JSON.stringify(members.slice(0, 3), null, 2));

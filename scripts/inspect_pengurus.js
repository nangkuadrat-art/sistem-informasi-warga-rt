const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = xlsx.readFile('C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx');
const akunSheet = xlsx.utils.sheet_to_json(wb.Sheets['AKUN'], { header: 1 });
console.log('=== PENGURUS IN AKUN SHEET ===');
akunSheet.forEach((r, idx) => {
  if (idx >= 6 && r[4]) {
    console.log(r);
  }
});

const warga = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/lib/data/db_warga.json'), 'utf-8'));
console.log('=== PENGURUS IN DB_WARGA ===');
warga.filter(w => ['superadmin', 'ketua_rt', 'bendahara', 'keamanan', 'sekretaris'].includes(w.role))
  .forEach(w => console.log({ no_unit: w.no_unit, alamat: w.alamat, nama: w.nama_kepala_keluarga, username: w.username, role: w.role, role_label: w.role_label }));
